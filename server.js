// server.js
import express from "express";
import fetch from "node-fetch";
import FormData from "form-data";
import cors from 'cors'
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/token", async (req, res) => {
  const formdata = new FormData();
  formdata.append("grant_type", "client_credentials");
  formdata.append("scope", "api profile");

  const tokenRes = await fetch("http://188.241.62.49:18080/auth/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic NDUzMTk2OTgwMzg4MTY3NjgxOlZuTmQ5NHVMZUQzRVFnTzBVQ21pejlWbUpaQUJ1RVhQTjRoV2MxbElQTUlMcTNKOUxKSHg3YzgxYXI5N3hkTVE=",
    },
    body: formdata
  });

  const data = await tokenRes.json();
  res.json(data); // Send token back to frontend
});

app.post("/api/gallery", async(req, res)=>{
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  // Get namespaceID and moduleID from the request body
  const { namespaceID, moduleID } = req.body;

  if (!namespaceID || !moduleID) {
    return res.status(400).json({ error: "Bad Request: namespaceID and moduleID are required" });
  }

  let response = await fetch(`http://188.241.62.49:18080/api/compose/namespace/${namespaceID}/module/${moduleID}/record/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
  });

  const data = await response.json();
  const allValues = data.response.set.map(x=> x.values)

  const allPromises = allValues.map(x=> {
    const attachmentID = x.find(y => y.name === 'Image');
    if(attachmentID){
      return fetch(`http://188.241.62.49:18080/api/compose/namespace/${namespaceID}/attachment/record/${attachmentID.value}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
      }).then(async (x)=> {
        const d = await x.json();
        return d.response
      });
    }
    return undefined
  });

  const attachments = await Promise.all(allPromises);

  res.json(attachments);
})

app.listen(3000, () => console.log("Proxy server running on port 3000"));
