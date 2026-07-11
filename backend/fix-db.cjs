const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/Schat').then(async () => {
  const Chat = require('./models/Chat.js').default;
  await Chat.updateMany({}, { $set: { archivedBy: [], deletedBy: [] } });
  console.log('Fixed DB');
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
