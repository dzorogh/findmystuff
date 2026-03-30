import { createSearchIndexConsumerHandler } from "./handler.ts";
import {
  authorizeSearchIndexConsumerRequest,
  deleteSearchIndexQueueMessageBatch,
  readSearchIndexQueueMessages,
  syncSearchIndexJob,
} from "./runtime.ts";

const handler = createSearchIndexConsumerHandler({
  authorizeRequest: authorizeSearchIndexConsumerRequest,
  readMessages: readSearchIndexQueueMessages,
  deleteMessages: deleteSearchIndexQueueMessageBatch,
  syncJob: syncSearchIndexJob,
  logError: (message, error) => {
    if (error !== undefined) {
      console.error(message, error);
      return;
    }

    console.error(message);
  },
});

Deno.serve(handler);
