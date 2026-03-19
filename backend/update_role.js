const db = require('./src/models/db');
db.query("UPDATE users SET role = 'admin' WHERE email = 'vairaselvi24@gmail.com'")
  .then(() => console.log('Successfully updated vairaselvi24@gmail.com to admin role!'))
  .catch(console.error)
  .finally(() => process.exit(0));
