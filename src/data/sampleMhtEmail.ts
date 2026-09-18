/**
 * Realistic Outlook-generated .MHT email archive sample for testing and demonstration.
 * Includes Outlook MIME headers, HTML with MSO classes, inline cid: image references,
 * tables, bullet lists, and base64-encoded image attachments.
 */

// A tiny valid 1x1 or small 48x48 PNG badge in base64
const SAMPLE_PNG_BASE64 = 
  'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA' +
  'B3RJTUUH6AMQEgw7pC8hvwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUH' +
  'AAACw0lEQVRo3u2Zz2sTURDHv9m32TRt2qTVtIlVq/iDiIqigodC75704EHEvXjxX8iDfxMv/gMv' +
  'HgTRk3jx5kUQj4IIeqgoIoqoqLWpSZvdbN/vw2zbbJtNaROk1YUHlsdm5/PezHv7dhaWZZGjRo4a' +
  'GZfIZ1V8N1R1n0LqC4hMh5b57lT9V51336l7+i69EUKwU323U/c2gM0xPQC4Dq5/Xv36vE2vALgA' +
  'gOM4eP1sF9/mZuH7PuLxeN/v7e0eXrtQ6r3D3W26j2/P9vB8bgo1r41cLtf3e13XUa/XAQBCiEOP' +
  'W1b9p1i/Wq1icnISpmm267Ua1tfX0Wq1MDk52fvzK5cv4f7DFzh3/kLfd1j38Hl2GpVKBcvLy5BS' +
  'otVqQUqJTCaDVCrV6bcsC7qug1IK3/eRzWb7vsfa1Sp838fW1hbCMESlUkEYhjAMA+12u9OPc47V' +
  '1VU4joPJyUlYltX3PQC4f+8W3s88ghAS8/PzmJycRD6fx8rKSqcfYwylUgmmafZ9/8hXqHnreHz/' +
  'Jubm5rC4uIjFxUUkEgmYpgkAGdMw28h00r97k8lk4r9LgUjA/4+ASMB/y84Qz69fPZ3y1x8vX5hG' +
  'KpV66p37f/65G5hOp9FoNOB5HuR2/4e3N1hZWRnvP9x+Z9bU1NSr8/n8u/F07Hqj0fhx4q1ZUkqc' +
  'Pn26435+fh7pdBq2baNarbbvM8Y6gZcuXeq8i0QiqFarHQfXdfHz1fB+J/5w8a5aKBaLWF9fR71e' +
  'R7Va7f48PDzccT8/P49arYZCoYDNzc2OXz6fR61WQ7VabffvBQDgw7svP5rN5k+v8f3v4Z2bNwAA' +
  'qNVqePPmDRYXF5HP57s71ut1lEolVCqVdrtUKqFer/8aAO7cfT03N9f6vYp/G1+wsv/4/vL+0f6y' +
  '5+84/gG/jKxL13tQkQAAAABJRU5ErkJggg==';

export const SAMPLE_OUTLOOK_MHT_EMAIL = `From: "Sarah Jenkins" <s.jenkins@enterprise-corp.com>
To: "Project Team" <team@enterprise-corp.com>
Subject: Q3 Executive Summary & Project Milestone Review
Date: Wed, 16 Sep 2026 14:20:00 +0000
MIME-Version: 1.0
Content-Type: multipart/related;
	boundary="----=_NextPart_000_Outlook_Sample_Boundary_984321";
	type="text/html"

This is a multi-part message in MIME format.

------=_NextPart_000_Outlook_Sample_Boundary_984321
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: quoted-printable
Content-Location: email.htm

<!DOCTYPE html>
<html xmlns:v=3D"urn:schemas-microsoft-com:vml" xmlns:o=3D"urn:schemas-mic=
rosoft-com:office:office" xmlns:w=3D"urn:schemas-microsoft-com:office:word"=
>
<head>
<meta http-equiv=3D"Content-Type" content=3D"text/html; charset=3Dutf-8">
<style>
/* Outlook Word Styles */
p.MsoNormal, li.MsoNormal, div.MsoNormal {
  margin: 0cm;
  font-size: 11.0pt;
  font-family: "Calibri", sans-serif;
  color: #1e293b;
}
table.MsoTableGrid {
  border: solid #cbd5e1 1.0pt;
  font-size: 10.0pt;
  font-family: "Calibri", sans-serif;
}
</style>
</head>
<body lang=3DEN-US style=3D"word-wrap:break-word">
<div class=3D"WordSection1">
  <div style=3D"display:flex; align-items:center; gap:16px; margin-bottom:1=
6px; border-bottom:2px solid #e20074; padding-bottom:12px;">
    <img src=3D"cid:status_badge@outlook.attachment" alt=3D"Milestone Badge=
" width=3D"48" height=3D"48" style=3D"display:inline-block; vertical-align=
:middle;" />
    <div>
      <h2 style=3D"margin:0; color:#e20074; font-family:'Segoe UI', Calibr=
i, sans-serif; font-size:18pt; font-weight:700;">Q3 Enterprise Initiative S=
tatus</h2>
      <p style=3D"margin:4px 0 0 0; color:#64748b; font-size:10.5pt; font-=
family:'Segoe UI', Calibri, sans-serif;">Executive Briefing &bull; Client D=
eliverables Approved</p>
    </div>
  </div>

  <p class=3D"MsoNormal" style=3D"line-height:1.6; margin-bottom:12px;">
    Hello Team,
  </p>

  <p class=3D"MsoNormal" style=3D"line-height:1.6; margin-bottom:14px;">
    Please find below the consolidated status update for the <b>Global Infr=
astructure Upgrade</b>. All priority milestones for this sprint have passed v=
alidation, and client deployment readiness has reached <span style=3D"color=
:#059669; font-weight:bold;">98.4%</span>.
  </p>

  <h3 style=3D"color:#0f172a; font-family:'Segoe UI', Calibri, sans-serif; =
font-size:13pt; margin-top:18px; margin-bottom:8px;">Sprint Deliverables S=
ummary</h3>

  <table class=3D"MsoTableGrid" border=3D"1" cellspacing=3D"0" cellpadding=
=3D"8" style=3D"width:100%; border-collapse:collapse; border:1px solid #cb=
d5e1; margin-bottom:16px;">
    <thead>
      <tr style=3D"background-color:#fdf2f8;">
        <th style=3D"border:1px solid #cbd5e1; padding:8px 12px; text-alig=
n:left; color:#9d174d; font-weight:bold;">Workstream</th>
        <th style=3D"border:1px solid #cbd5e1; padding:8px 12px; text-alig=
n:left; color:#9d174d; font-weight:bold;">Owner</th>
        <th style=3D"border:1px solid #cbd5e1; padding:8px 12px; text-alig=
n:left; color:#9d174d; font-weight:bold;">Status</th>
        <th style=3D"border:1px solid #cbd5e1; padding:8px 12px; text-alig=
n:left; color:#9d174d; font-weight:bold;">Next Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px;">Cloud Dat=
a Migration</td>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px;">DevOps En=
gineering</td>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px; color:#059=
669; font-weight:600;">Completed</td>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px;">Monitor s=
torage latency</td>
      </tr>
      <tr style=3D"background-color:#f8fafc;">
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px;">Security =
& Auth Audit</td>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px;">SecOps Te=
am</td>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px; color:#059=
669; font-weight:600;">Verified</td>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px;">Sign-off r=
eport archive</td>
      </tr>
      <tr>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px;">Email Com=
poser UI Redesign</td>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px;">Frontend =
Guild</td>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px; color:#028=
4c7; font-weight:600;">In Progress</td>
        <td style=3D"border:1px solid #cbd5e1; padding:8px 12px;">Review M=
HT file import support</td>
      </tr>
    </tbody>
  </table>

  <h3 style=3D"color:#0f172a; font-family:'Segoe UI', Calibri, sans-serif; =
font-size:13pt; margin-top:16px; margin-bottom:8px;">Key Next Steps</h3>
  <ul style=3D"margin-top:0; margin-bottom:16px; padding-left:24px; color:#=
334155; line-height:1.7;">
    <li>Coordinate team availability for the Friday deployment window.</li>
    <li>Finalize QA testing against legacy Outlook 2016 / 2019 formatting r=
ules.</li>
    <li>Distribute client sign-off documentation before end-of-week.</li>
  </ul>

  <p class=3D"MsoNormal" style=3D"line-height:1.6; margin-top:20px;">
    Best regards,<br/>
    <b>Sarah Jenkins</b><br/>
    <span style=3D"color:#64748b; font-size:10pt;">VP of Engineering &bull;=
 Enterprise Solutions</span>
  </p>
</div>
</body>
</html>

------=_NextPart_000_Outlook_Sample_Boundary_984321
Content-Type: image/png; name="status_badge.png"
Content-Transfer-Encoding: base64
Content-ID: <status_badge@outlook.attachment>
Content-Location: status_badge.png

${SAMPLE_PNG_BASE64}

------=_NextPart_000_Outlook_Sample_Boundary_984321--
`;
