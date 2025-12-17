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
<< /Length 5321 >>
stream
BT
/F1 11 Tf
14 TL
72 750 Td
(Criterion C - Development Narrative) Tj
T*
(Overview) Tj
T*
(I structured the development log around the three most interesting technical techniques: \(1\) persistent JSON data management with safe upserts, \(2\) constraint-driven filtering and scoring of exercises, and \(3\) stochastic-yet-repeatable programming logic that balances volume, time, and novelty. Each section references concrete modules in the Product folder.) Tj
T*
(1. JSON Datastore with Idempotent Upserts \(`src/datastore.py`\)) Tj
T*
(The client wanted the freedom to edit saved plans manually, so SQLite or Firebase felt excessive. Instead, `_read_json` and `_write_json` wrap Python's `json` module and enforce directory creation using `pathlib.Path`. The helper automatically seeds empty arrays if the files are missing, which simplified onboarding on the Chromebook. The critical technique shows up in `save_user`: I perform an upsert by filtering the existing array with a list comprehension `[u for u in users if u.get\("user_id"\) != user_dict.get\("user_id"\)]` before appending the new payload. This functional approach guarantees uniqueness without needing an index. Additionally, `get_recent_exercise_names` slices the plans array \(`plans = plans[-lookback_plans:]`\) so the generator never scans more data than needed, which keeps the CLI responsive even if Elena logs dozens of weeks.) Tj
T*
(2. Algorithmic Filtering and Scoring \(`src/generator.py`\)) Tj
T*
(The generator is intentionally modular. `_filter_exercises` enforces three independent constraints: avoidance list, difficulty threshold, and equipment availability. To make the avoid list robust I lower-case all exercise names before comparisons, preventing mismatches due to casing. This filtering returns a clean array of `Exercise` objects ready for scoring.) Tj
T*
(The `_score` function embodies algorithmic thinking: it starts at 100, subtracts points for any movement pattern we've already used that day, and penalizes repeats within the `recent_names` set by 40 points. Compound lifts earn a small bonus so they bubble to the top when `_pick_best` sorts the list. `_pick_best` adds a controlled randomness by shuffling only the top five entries before slicing to `k`. Elena specifically asked for this after noticing that deterministic plans felt robotic.) Tj
T*
(During development I profiled different penalty weights by printing debug tables and discovered that a 10-point movement penalty prevented single-day overload without starving accessories entirely. Because `_pick_best` receives the shared `movement_counts` dictionary, both compound and accessory loops push/pull/hinge/squat totals toward equilibrium automatically.) Tj
T*
(3. Plan Assembly and Goal-Specific Formatting) Tj
T*
(`generate_plan` starts by mapping `days_per_week` to an evidence-based split \(`SPLITS`\). Within every day loop I track `weekly_compound_targets`, a set containing squat, hinge, push, pull. Whenever `_format_exercise` adds a compound, I discard that movement from the set, which pushes the next day to prioritize the untouched movements. This is the mechanic that gives Elena confidence the AI is not forgetting squats for an entire week.) Tj
T*
(The accessory loop monitors both time \(`session_minutes`\) and maximum exercise count. I subtract ten minutes as an automatic buffer for warm-up and transitions, ensuring the resulting prescription is realistic. After each selection I append the exercise name to `recent_set` immediately, which prevents the same dumbbell curl from showing up twice in one day. `_format_exercise` pulls the correct rep range out of the nested `GOAL_REPS` dictionary keyed by goal and compound/accessory classification. Returning a string like `"3 x 6-10"` may seem simple, but encoding it in data ensures future modifications \(e.g., tempo prescriptions\) only require editing `GOAL_REPS`.) Tj
T*
(4. User Interface Binding \(`src/ui_cli.py` and `src/main.py`\)) Tj
T*
(I kept the CLI minimal but resilient by wrapping list inputs \(`equipment`, `avoid`\) in the `prompt_list` helper so blank entries naturally become `[]`. The menu loop in `main.py` is agnostic to program changes; it loads JSON on-demand, instantiates `UserProfile` via `.from_dict`, and only passes full-fledged objects to the generator. This architecture allowed me to add validation logic \(e.g., making sure the user exists before calling `generate_for_user`\) without touching the algorithm core.) Tj
T*
(5. Testing Hooks) Tj
T*
(Although formal unit tests are TBD, I instrumented the generator by running `python3 -m src.main` with sample data. Additionally, the repo includes an empty `tests/test_generator.py` file scaffold so pytest fixtures can easily be added later. The deterministic pieces \(filtering, scoring\) were manually verified by feeding known data sets and printing intermediate results. Because JSON is simple text, verifying persistence was as fast as running `cat data/users.json` after each action.) Tj
T*
(Source Attribution) Tj
T*
(No external code snippets were copied. The only references consulted were the Python 3.9 documentation for `dataclasses` and `pathlib`, both cited in inline comments where relevant. All algorithms were authored from scratch and reviewed with the client for domain accuracy.) Tj
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
0000005613 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
5683
%%EOF
