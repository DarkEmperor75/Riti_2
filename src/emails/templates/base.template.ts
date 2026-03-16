export const wrapBase = (subject: string, body: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>${subject}</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&family=Albert+Sans:wght@500&display=swap" rel="stylesheet">

<style>
body {
  margin:0;
  padding:0;
  background:#F9F9F9;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}

.wrapper {
  padding:70px 16px;
}

.container {
  max-width:420px;
  margin:0 auto;
  background:#ffffff;
  border-radius:20px;
  border:1px solid #CECECE;
  padding:50px 40px 40px 40px;
}

.logo {
  width:60px;
  height:auto;
  display:block;
  margin:0 auto;
}

.content {
  margin-top:40px;
}

h1 {
  font-size:24px;
  font-weight:600;
  letter-spacing:-1.2px;
  color:#111;
  margin-bottom:16px;
}

p {
  font-size:15px;
  line-height:22px;
  color:#424040;
  margin-bottom:16px;
}

.btn {
  display:inline-block;
  background:#0057FF;
  color:#ffffff !important;
  padding:12px 24px;
  border-radius:8px;
  font-weight:700;
  text-decoration:none;
  margin:20px 0;
}

.detail-box {
  background:#F2EFF3;
  padding:18px 20px;
  border-radius:8px;
  margin:20px 0;
}

.detail-box p {
  margin:6px 0;
  font-size:14px;
}

.detail-label {
  font-size:12px;
  color:#84828E;
}

.footer {
  margin-top:30px;
  text-align:center;
}

.footer-btn {
  display:inline-block;
  background:#d63ce8;
  color:#ffffff !important;
  padding:12px 22px;
  border-radius:10px;
  font-size:13px;
  font-weight:600;
  font-family:"Albert Sans", Arial, sans-serif;
  text-decoration:none;
}

a {
  color:inherit;
  text-decoration:none;
}
</style>

</head>

<body>

<div class="wrapper">

<div class="container">

<img
  src="https://ggtdvczvgkfyairezcgu.supabase.co/storage/v1/object/public/riti-public-assets/riti-logo.jpg"
  class="logo"
  alt="Riti"
/>

<div class="content">
${body}
</div>

<div class="footer">
  <a href="https://riti-mvp-frontend.vercel.app" class="footer-btn">
    Riti
  </a>
</div>

</div>
</div>

</body>
</html>
`;
