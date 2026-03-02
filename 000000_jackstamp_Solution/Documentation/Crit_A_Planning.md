%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 3950 >>
stream
BT
/F1 11 Tf
14 TL
72 750 Td
(Criterion A - Planning) Tj
T*
(Scenario) Tj
T*
(Client: Coach Elena Morales, founder of StriveWell, the remote strength-coaching collective where I intern. She oversees thirty clients and keeps weekly workouts in a color-coded Google Sheet that only she edits. During our kickoff call on 5 February she stated, "Copying and pasting workouts between tabs wastes thirty minutes and I keep reusing the same lifts by mistake," highlighting the inefficiency I am targeting. Because clients train in apartments with limited gear, Elena must juggle their equipment lists manually and currently cannot see whether she has overused a specific movement in consecutive plans. Missed variation leads to client boredom and churn, so she needs a lightweight planning tool that respects her constraints.) Tj
T*
(Problem Summary) Tj
T*
(The spreadsheet workflow does not enforce equipment filters, it has no awareness of a client's recent exercises, and it requires Elena to track rest days mentally. These manual steps introduce errors and reduce the time she has for coaching. She asked for a script that runs locally on her Chromebook, prompts her for the same data she currently types into the sheet, and then outputs a balanced routine she can paste into email. Persisting the profiles and generated plans was part of the request so that trend data survives across weeks.) Tj
T*
(Rationale) Tj
T*
(I selected Python 3.9 with a text-based CLI because Elena can execute it inside the Crostini Linux container on her Chromebook without needing proprietary tools. The existing generator uses dataclasses \(`src/models.py`\) to ensure each exercise and user profile is validated before serialization. JSON files in `data/` are portable and human readable, letting Elena inspect saved plans with any editor while avoiding the overhead of provisioning a hosted database. The algorithmic core lives in `src/generator.py`, where functional decomposition \(`_filter_exercises`, `_score`, `_pick_best`, `_format_exercise`\) balances clarity with testability. Compared to a spreadsheet macro or low-code platform, Python gives me the control to implement heuristics such as avoiding the previous three plans, tagging movement patterns, and reshuffling sets/reps per goal, all of which the client specifically requested. The CLI front end in `src/ui_cli.py` keeps the UX simple for now while leaving room to wrap it in a Flask or React interface later if remote access becomes necessary.) Tj
T*
(Success Criteria \(agreed 6 February\)) Tj
T*
(1. The CLI must let the coach create or update a user profile, capturing goal, days/week, session minutes, available equipment, and exercises to avoid, then persist it to `data/users.json` while preventing duplicate IDs.) Tj
T*
(2. The coach must be able to enter a stored user ID and immediately generate a multi-day plan that matches the `days_per_week` split and prints a human-readable summary grouped by day/type.) Tj
T*
(3. Generated plans must exclude any exercise performed by the same user in their three most recent saved plans so that weekly novelty is preserved automatically.) Tj
T*
(4. The selection algorithm must only recommend exercises that match the profile's equipment list and have a difficulty rating of three or lower to keep the program beginner-friendly, unless future updates extend this threshold.) Tj
T*
(5. Each exercise in the printed plan must include its movement pattern label plus set and rep ranges that map to the user's goal \(strength, hypertrophy, or fitness\) so Elena can verify programming intent at a glance.) Tj
T*
(6. Every time a plan is generated it must be appended to `data/plans.json` with the associated `user_id`, enabling longitudinal progress checks and proof of persistence during Criterion D's video.) Tj
T*
(The client confirmed by email that these six criteria capture the minimum viable product for replacing her spreadsheet workflow.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000004242 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
4312
%%EOF
