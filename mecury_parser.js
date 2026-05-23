const Mercury = require('@postlight/mercury-parser');

const url = 'https://lifestyle.znews.vn/dang-sau-su-ra-di-dot-ngot-cua-dien-vien-ngoc-trinh-post1581855.html';

Mercury.parse(url)
  .then(result => {
    console.log(result.title);
    console.log(result.content);
  })
  .catch(err => console.error(err));
