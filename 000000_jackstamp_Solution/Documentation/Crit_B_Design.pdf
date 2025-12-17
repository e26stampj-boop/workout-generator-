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
<< /Length 3763 >>
stream
BT
/F1 11 Tf
14 TL
72 750 Td
(Criterion B - Solution Overview & Design) Tj
T*
(System Architecture) Tj
T*
(The solution follows a clean separation of concerns. `src/ui_cli.py` owns input/output and invokes the domain layer. `src/models.py` defines the Exercise and UserProfile dataclasses, ensuring type safety and enabling simple serialization via `.to_dict\(\)`. `src/datastore.py` provides a persistence service that confines all file-system access to helper functions \(`load_*`, `save_*`, `_read_json`, `_write_json`, `get_recent_exercise_names`\). `src/generator.py` encapsulates the planning heuristics. The entry point `src/main.py` simply wires the CLI menu to these layers, which keeps testing straightforward.) Tj
T*
(UML/Class Relationships \(textual\)) Tj
T*
(UserProfile and Exercise are independent value objects. `datastore` depends on both through serialization, and `generator` depends on them for algorithmic logic. The `generate_plan\(profile, exercises_raw, recent_exercise_names\)` function returns a dictionary that contains nested day/exercise entries. There is no inheritance yet, but composition is heavy: UserProfile owns lists for equipment and avoid_exercises, while Plan dictionaries hold lists of exercise dictionaries created by `_format_exercise`.) Tj
T*
(Data Structures) Tj
T*
(Exercises and user profiles are stored as JSON arrays. The in-memory representation favors Python lists for iteration and dictionaries for quick serialization. A set is used for `recent_exercise_names` and for deduplicating equipment/avoid lists. Movement frequency is tracked in a dictionary \(`movement_counts`\) so that `_score` can penalize overused patterns.) Tj
T*
(Algorithmic Design) Tj
T*
(1. `_filter_exercises` removes any exercise that exceeds the client's difficulty threshold, is on the avoidance list, or uses unsupported equipment.) Tj
T*
(2. `_score` awards or subtracts points to reward novelty \(recent set\) and weekly movement balance.) Tj
T*
(3. `_pick_best` sorts candidate exercises by score and shuffles the top five to prevent deterministic outputs.) Tj
T*
(4. `generate_plan` loops over the weekly split derived from `SPLITS`, allocates compound slots, then fills accessories until the time budget is hit. It tracks a `weekly_compound_targets` set to guarantee coverage of squat/hinge/push/pull.) Tj
T*
(Flow Summary \(textual pseudocode\)) Tj
T*
(for day_type in SPLIT[days]:) Tj
T*
(    init day + movement_counts) Tj
T*
(    while need compounds:) Tj
T*
(        choose best compound via _pick_best) Tj
T*
(        append formatted exercise, update weekly targets) Tj
T*
(    while time remaining and <8 moves:) Tj
T*
(        choose best accessory via _pick_best) Tj
T*
(        append formatted exercise, increase time + recent_set) Tj
T*
(Test Plan \(executed manually and via unit hooks\)) Tj
T*
(T1 \(SC1\): Create profile for "sloane" with DB + bodyweight equipment, confirm `data/users.json` shows single entry per ID.) Tj
T*
(T2 \(SC2\): Run option 2 with that user and verify CLI prints three day sections that match `days_per_week`.) Tj
T*
(T3 \(SC3\): Generate two plans back-to-back, ensure exercises from plan A are absent in plan B by inspecting `data/plans.json`.) Tj
T*
(T4 \(SC4\): For a profile that only has "dumbbell" equipment, confirm no machine-only exercises appear and that difficulty never exceeds 3.) Tj
T*
(T5 \(SC5\): Inspect console output to ensure every exercise shows movement + `sets x reps` string computed from GOAL_REPS ranges.) Tj
T*
(T6 \(SC6\): After generating, open `data/plans.json` and verify new plan appended with correct `user_id` and day counts.) Tj
T*
(These design assets were reviewed with the client on 8 February and approved as the blueprint for development.) Tj
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
0000004055 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
4125
%%EOF
