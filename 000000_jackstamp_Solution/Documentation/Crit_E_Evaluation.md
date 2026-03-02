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
<< /Length 2218 >>
stream
BT
/F1 11 Tf
14 TL
72 750 Td
(Criterion E - Evaluation) Tj
T*
(Summary Against Success Criteria) Tj
T*
(1. Profile CRUD \(Met\): Demonstrated at 00:35 of the video script. JSON output shows single object per ID, satisfying SC1.) Tj
T*
(2. Split-Specific Plan Output \(Met\): Day groupings match requested split at 01:20, fulfilling SC2.) Tj
T*
(3. Recent Exercise Avoidance \(Partially Met\): The logic excludes the past three plans, but Elena noticed duplicate accessories when a user only has two machines. Marked partially met and noted as future enhancement.) Tj
T*
(4. Equipment/Difficulty Filtering \(Met\): Manual inspection of the last three plans confirms no unsupported equipment or difficulty >3, satisfying SC4.) Tj
T*
(5. Movement + Set/Rep Visibility \(Met\): Console output clearly labels movement and goal-specific reps, fulfilling SC5.) Tj
T*
(6. Plan Persistence \(Met\): Showing `data/plans.json` after restart at 03:05 proves SC6.) Tj
T*
(Client Feedback \(13 Feb handoff\)) Tj
T*
(Elena said, "I finally feel confident I am not repeating the same hinge three weeks in a row, and saving plans to JSON means I can audit anyone's history in seconds." She requested a small UX tweak: "Let me tag plans with a coaching note so I remember why I picked a superset." These quotes are archived in Appendix C.) Tj
T*
(Recommendations) Tj
T*
(1. Implement optional tagging + coach notes stored alongside each plan to capture Elena's qualitative feedback without leaving the CLI. This extends SC6 beyond raw exercise data.) Tj
T*
(2. Add a second difficulty tier that unlocks higher-rated exercises once a user logs six consecutive weeks, making the generator adaptive rather than static.) Tj
T*
(3. Replace JSON with a lightweight SQLite database before multi-coach deployment. Doing this now would be premature, but concurrency becomes mandatory if StriveWell hires another coach.) Tj
T*
(Testing Gaps) Tj
T*
(Edge-case automation is still light. The next sprint should add pytest suites for `_filter_exercises` and `_score` to guarantee regression coverage. Nonetheless, manual verification and the recorded walkthrough demonstrate that the delivered product meets the client's most critical needs.) Tj
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
0000002510 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
2580
%%EOF
