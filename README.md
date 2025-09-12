  
  # Reliable Causal Broadcast Playground

  This playground lets you broadcast messages between Alice, Bob and Carol. Sending a message adds it to list of undelivered messages. You can then deliver those messages in causal order.

  Reliable Causal Broadcast is a pre-requisite for operation-based CRDTs (Conflict-free Replicated Data Types).

  ## Version vectors

  We use version vectors to achieve causal delivery.
  Version vector at position *i* means "the number of messages from node *i* that have been delivered to this node". A message `m1` causally happens-before message `m2` if `m1`'s version vector is less than or equal to `m2`'s version vector in all positions and strictly less in at least one position. This means that for a message to be delivered, all messages that causally happen-before it must have already been delivered.

  ## Try It Out

  You can try it yourself by sending "Helo" from Alice and then sending "Hello*" fix from Alice before delivering the first message to Bob and Carol. The buttons to send the second message will be disabled, forcing you to first deliver the initial "Helo" message.
