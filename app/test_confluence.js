require('dotenv').config({ path: '.env.local' });

// Let's use fetch since it's built into Node 18+

async function testConfluence() {
  const domain = process.env.CONFLUENCE_DOMAIN;
  const email = process.env.CONFLUENCE_EMAIL;
  const token = process.env.CONFLUENCE_API_TOKEN;
  const spaceKey = process.env.CONFLUENCE_SPACE_KEY;

  console.log(`Domain: ${domain}`);
  console.log(`Space: ${spaceKey}`);

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  try {
    // Fetch pages in the space
    const url = `https://${domain}/wiki/rest/api/content?spaceKey=${spaceKey}&expand=body.storage`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      console.error(`HTTP Error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(text);
      return;
    }
    
    const data = await res.json();
    console.log(`Found ${data.results.length} pages.`);
    if (data.results.length > 0) {
      console.log(`First page title: ${data.results[0].title}`);
      console.log(`First page content length: ${data.results[0].body.storage.value.length}`);
    }
  } catch (err) {
    console.error(err);
  }
}

testConfluence();
