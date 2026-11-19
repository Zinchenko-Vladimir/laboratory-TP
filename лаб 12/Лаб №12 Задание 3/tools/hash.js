// Использование: node tools/hash.js <пароль>  -> строка "salt:hash" (scrypt) для users.json
const crypto = require('crypto');
const pwd = process.argv[2];
if (!pwd) { console.error('Укажите пароль: node tools/hash.js <пароль>'); process.exit(1); }
const salt = crypto.randomBytes(16).toString('hex');
console.log(`${salt}:${crypto.scryptSync(pwd, salt, 64).toString('hex')}`);
