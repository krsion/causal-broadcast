import { useCallback, useState } from 'react'

type Node = {
  id: number,
  name: string,
  vectorClock: number[],
  observedMessages: Message[],
}

type Message = {
  id: number,
  from: number,
  to: number,
  clock: number[]
  content: string,
}

const isCausallyStable = (message: Message, receiverVectorClock: number[]): boolean => 
  message.clock.every((messageTime, index) => 
    index === message.from 
      ? messageTime === receiverVectorClock[index] + 1 
      : messageTime <= receiverVectorClock[index]
  );

const Node = ({ node, onMessageSend, nodes }: { node: Node, onMessageSend: (from: number, content: string) => void, nodes: Node[] }) => {
  const [message, setMessage] = useState("");
  return (
    <div>
      <h2>{node.name}</h2>
      <label>Vector Clock: (</label>
      {node.vectorClock.map((val, index) => (
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
            {`${nodes[msg.from].name}: "${msg.content}" (Clock: [${msg.clock.join(', ')}])`}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [nodes, setNodes] = useState<Node[]>(
    [
      { id: 0, name: 'Alice', vectorClock: [0, 0, 0], observedMessages: [] },
      { id: 1, name: 'Bob', vectorClock: [0, 0, 0], observedMessages: [] },
      { id: 2, name: 'Carol', vectorClock: [0, 0, 0], observedMessages: [] }
    ]
  );

  const [undeliveredMessages, setUndeliveredMessages] = useState<Message[]>([]);

  const receiveMessage = useCallback((message: Message) =>{
    const receiverVectorClock = nodes[message.to].vectorClock;
    let updatedReceiverVectorClock = [...receiverVectorClock];
    for (let i = 0; i < updatedReceiverVectorClock.length; i++) {
      updatedReceiverVectorClock[i] = Math.max(updatedReceiverVectorClock[i], message.clock[i]);
    }
    // update receiver's vector clock and add the message to observed messages
    setNodes(nodes => nodes.map(n => n.id === message.to ? { ...n, vectorClock: updatedReceiverVectorClock, observedMessages: [...n.observedMessages, message] } : n));
  }, [nodes]);

  return (
    <>
      <h1>Causal Broadcast</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        {nodes.map((node) => (
          <Node key={node.id} node={node} nodes={nodes} onMessageSend={(from, content) => {
            let senderVectorClock = [...nodes[from].vectorClock];
            senderVectorClock[from]++;
            const newMessages: Message[] = nodes
              .filter(n => n.id !== from)
              .map(n => ({
                id: Date.now() + n.id, // Ensure unique IDs for each message
                from,
                to: n.id,
                clock: senderVectorClock,
                content
              }));
            const messageForSelf: Message = {
              id: Date.now() + from,
              from,
              to: from,
              clock: senderVectorClock,
              content
            };
            // add the message to sender's observed messages
            setNodes(nodes => nodes.map(n => n.id === from ? { ...n, vectorClock: senderVectorClock, observedMessages: [...n.observedMessages, messageForSelf] } : n));
            setUndeliveredMessages(messages => [...messages, ...newMessages]);
          }} />
        ))}
      </div>

      <h2>Messages sent but not delivered</h2>
      {undeliveredMessages.map((message, index) => (
        <div key={message.id}>
          {`${nodes[message.from].name} → ${nodes[message.to].name}: "${message.content}" (${message.clock.join(', ')})`}
          <button onClick={() => {
            setUndeliveredMessages(messages => messages.filter((_, i) => i !== index));
            receiveMessage(message);
          }} disabled={!isCausallyStable(message, nodes[message.to].vectorClock)}>
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
        Vector clock at position <i>i</i> means "the number of messages from node <i>i</i> that have been delivered to this node". A message m1 causally precedes message m2 if m1's vector clock is less than or equal to m2's vector clock in all positions and strictly less in at least one position. This means that for a message to be delivered, all messages that causally precede it must have already been delivered.
      </p>
      <h2>Try it out</h2>
      <p>
        You can try it yourself by sending "Helo" from Alice and then sending "Hello*" fix from Alice before delivering the first message to Bob and Carol. The buttons to send the second message will be disabled forcing you to first deliver the initial "Helo" message.
      </p>
    </>
  )
}

export default App;
