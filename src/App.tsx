import { useCallback, useState } from 'react'

type Node = {
  id: number,
  name: string,
  versionVector: number[],
  observedMessages: Message[],
}

type Message = {
  id: number,
  from: number,
  to: number,
  versionVector: number[]
  content: string,
}

const isCausallyStable = (message: Message, receiverVersionVector: number[]): boolean => 
  message.versionVector.every((messageTime, index) => 
    index === message.from 
      ? messageTime === receiverVersionVector[index] + 1 
      : messageTime <= receiverVersionVector[index]
  );

const Node = ({ node, onMessageSend, nodes }: { node: Node, onMessageSend: (from: number, content: string) => void, nodes: Node[] }) => {
  const [message, setMessage] = useState("");
  return (
    <div>
      <h2>{node.name}</h2>
      <label>Version Vector: (</label>
      {node.versionVector.map((val, index) => (
        <span key={index}>{index === node.id ? <b>{val}</b> : <span>{val}</span>}{(index === nodes.length - 1 ? "" : ", ")}</span>
      ))}
      )<br />
      <input type="text" placeholder="Message" value={message} onChange={(e) => setMessage(e.currentTarget.value)} />
      <button disabled={!message} onClick={() => {
        onMessageSend(node.id, message);
        setMessage("");
      }}>Send</button>
      <div>
        <h3>Observed Messages</h3>
        {node.observedMessages.map((msg) => (
          <div key={msg.id}>
            {`${nodes[msg.from].name}: "${msg.content}" (Version Vector: [${msg.versionVector.join(', ')}])`}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [nodes, setNodes] = useState<Node[]>(
    [
      { id: 0, name: 'Alice', versionVector: [0, 0, 0], observedMessages: [] },
      { id: 1, name: 'Bob', versionVector: [0, 0, 0], observedMessages: [] },
      { id: 2, name: 'Carol', versionVector: [0, 0, 0], observedMessages: [] }
    ]
  );

  const [undeliveredMessages, setUndeliveredMessages] = useState<Message[]>([]);

  const receiveMessage = useCallback((message: Message) =>{
    const receiverVersionVector = nodes[message.to].versionVector;
    let updatedReceiverVersionVector = [...receiverVersionVector];
    for (let i = 0; i < updatedReceiverVersionVector.length; i++) {
      updatedReceiverVersionVector[i] = Math.max(updatedReceiverVersionVector[i], message.versionVector[i]);
    }
    // update receiver's version vector and add the message to observed messages
    setNodes(nodes => nodes.map(n => n.id === message.to ? { ...n, versionVector: updatedReceiverVersionVector, observedMessages: [...n.observedMessages, message] } : n));
  }, [nodes]);

  return (
    <>
      <h1>Causal Broadcast</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        {nodes.map((node) => (
          <Node key={node.id} node={node} nodes={nodes} onMessageSend={(from, content) => {
            let senderVersionVector = [...nodes[from].versionVector];
            senderVersionVector[from]++;
            const newMessages: Message[] = nodes
              .filter(n => n.id !== from)
              .map(n => ({
                id: Date.now() + n.id, // Ensure unique IDs for each message
                from,
                to: n.id,
                versionVector: senderVersionVector,
                content
              }));
            const messageForSelf: Message = {
              id: Date.now() + from,
              from,
              to: from,
              versionVector: senderVersionVector,
              content
            };
            // add the message to sender's observed messages
            setNodes(nodes => nodes.map(n => n.id === from ? { ...n, versionVector: senderVersionVector, observedMessages: [...n.observedMessages, messageForSelf] } : n));
            setUndeliveredMessages(messages => [...messages, ...newMessages]);
          }} />
        ))}
      </div>

      <h2>Messages sent but not delivered</h2>
      {undeliveredMessages.map((message, index) => (
        <div key={message.id}>
          {`${nodes[message.from].name} → ${nodes[message.to].name}: "${message.content}" (${message.versionVector.join(', ')})`}
          <button onClick={() => {
            setUndeliveredMessages(messages => messages.filter((_, i) => i !== index));
            receiveMessage(message);
          }} disabled={!isCausallyStable(message, nodes[message.to].versionVector)}>
            Deliver
          </button>
        </div>
      ))}
      <hr />
      <h2>Explanation</h2>
      <p>
        Reliable Causal Broadcast is pre-requisite for operation-based CRDTs (Conflict-free Replicated Data Types). It ensures that messages (operations) are delivered to all nodes in an order that respects their causal relationships. This means that if one message causally depends on another, the dependent message will not be delivered before the message it depends on.
      </p>
      <p>
        Version vector at position <i>i</i> means "the number of messages from node <i>i</i> that have been delivered to this node". A message m1 causally precedes message m2 if m1's version vector is less than or equal to m2's version vector in all positions and strictly less in at least one position. This means that for a message to be delivered, all messages that causally precede it must have already been delivered.
      </p>
      <h2>Try it out</h2>
      <p>
        You can try it yourself by sending "Helo" from Alice and then sending "Hello*" fix from Alice before delivering the first message to Bob and Carol. The buttons to send the second message will be disabled forcing you to first deliver the initial "Helo" message.
      </p>
    </>
  )
}

export default App;
