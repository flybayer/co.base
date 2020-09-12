const createDocStore = require("../cloud-docs/createDocStore");

const postCommentAction = {
  mutate: async (page, action) => {},
  mutateLocal: (action, doc) => {
    doc.comments.push({ message: action.message });
    return doc;
  },
};

const pageComments = createDocStore({
  get: async (page) => {
    return { comments: [] };
  },
  actions: {
    postComment: postCommentAction,
  },
});

module.exports = pageComments;
