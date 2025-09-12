  
  # Reliable Causal Broadcast Playground

  This playground lets you broadcast messages between Alice, Bob and Carol. Sending a messages adds it to list of undelivered messages. You can then deliver messages in any order you want which respects causality. 

  Reliable Causal Broadcast is a pre-requisite for operation-based CRDTs (Conflict-free Replicated Data Types). It ensures that messages (operations) are delivered to all nodes in an order that respects their causal relationships. This means that if one message causally depends on another, the dependent message will not be delivered before the message it depends on.

  ## Version vectorss

  Version vector at position *i* means "the number of messages from node *i* that have been delivered to this node". A message `m1` causally precedes message `m2` if `m1`'s version vector is less than or equal to `m2`'s version vector in all positions and strictly less in at least one position. This means that for a message to be delivered, all messages that causally precede it must have already been delivered.

  ## Try It Out

  You can try it yourself by sending "Helo" from Alice and then sending "Hello*" fix from Alice before delivering the first message to Bob and Carol. The buttons to send the second message will be disabled, forcing you to first deliver the initial "Helo" message.
