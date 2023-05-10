"use strict"
function cell_make(i, j) {
    return {
        filled: false
    };
}

function grid_make(opts) {
    opts = opts || {};
    // Make grid with 20 visible rows and 20 hidden buffer rows above.
    let nrows = 20;
    let ncols = 10;
    if (opts.use_test_grid || false) {
        nrows = 6;
        ncols = 5;
    }

    const obj = {
        data: [],
        buffer: []
    };

    for (let i = 0; i < nrows; i++) {
        const row = [];
        for (let j = 0; j < ncols; j++) {
            row.push(cell_make(i, j));
        }
        obj.data.push(row);
    }

    // Add hidden buffer rows.
    // Hidden buffer rows are accessed by calling `get` with a negative row.
    for (let i = 0; i < nrows; i++) {
        const row = [];
        for (let j = 0; j < ncols; j++) {
            row.push(cell_make(i, j));
        }
        obj.buffer.push(row);
    }

    obj.get = function (i, j) {
        console.assert(i >= -nrows && i < nrows);
        console.assert(j >= 0 && j < ncols);
        if (i < 0) {
            return obj.buffer[-(i + 1)][j];
        }
        return obj.data[i][j];
    }
    obj.has = function (i, j) {
        if (!(i >= -nrows && i < nrows)) {
            return false;
        }
        if (!(j >= 0 && j < ncols)) {
            return false;
        }
        return true;
    }
    obj.has_visible = function (i, j) {
        if (!(i >= 0 && i < nrows)) {
            return false;
        }
        if (!(j >= 0 && j < ncols)) {
            return false;
        }
        return true;
    }
    obj.nrows = function () {
        return obj.data.length;
    }
    obj.ncols = function () {
        return obj.data[0].length;
    }
    return obj;
}

function tetrimino_make(opts) {
    opts = opts || {};
    const obj = {
        i: opts.i !== undefined ? opts.i : 0,
        j: opts.j !== undefined ? opts.j : 1,
        type: opts.type || "test",
        rotation_index: opts.rotation_index || 0
    };

    obj.copy = function () {
        const tcopy = tetrimino_make(opts);
        tcopy.i = obj.i;
        tcopy.j = obj.j;
        tcopy.type = obj.type;
        tcopy.rotation_index = obj.rotation_index;
        return tcopy;
    };

    // make_offsets is a helper to construct a list of rotation offsets.
    function make_offsets(pictures) {
        const offsets = [];
        pictures.forEach((picture) => {
            let iOrigin = null;
            let jOrigin = null;
            for (let i = 0; i < picture.length; i++) {
                for (let j = 0; j < picture[i].length; j++) {
                    if (picture[i][j] == "O" || picture[i][j] == "X") {
                        iOrigin = i;
                        jOrigin = j;
                        break;
                    }
                }
            }
            console.assert(iOrigin !== null && jOrigin !== null)
            const rotation = [];
            for (let i = 0; i < picture.length; i++) {
                for (let j = 0; j < picture[i].length; j++) {
                    if (picture[i][j] == "#" || picture[i][j] == "X") {
                        rotation.push(
                            {
                                i: i - iOrigin,
                                j: j - jOrigin
                            }
                        )
                    }
                }
            }
            offsets.push(rotation);
        });
        return offsets;
    }

    const rotation_map = {
        "test":
            make_offsets([
                [
                    "...",
                    ".X#",
                    "..."
                ],
                [
                    "...",
                    ".X.",
                    ".#."
                ],
                [
                    "...",
                    "#X.",
                    "..."
                ],
                [
                    ".#.",
                    ".X.",
                    "..."
                ]
            ]),

        "I":
            make_offsets([
                [
                    "....",
                    "#X##",
                    "....",
                    "...."
                ],
                [
                    "..#.",
                    ".O#.",
                    "..#.",
                    "..#."
                ],
                [
                    "....",
                    ".O..",
                    "####",
                    "...."
                ],
                [
                    ".#..",
                    ".X..",
                    ".#..",
                    ".#.."
                ],
            ]),

        "J":
            make_offsets([
                [
                    "#..",
                    "#X#",
                    "...",
                ],
                [
                    ".##",
                    ".X.",
                    ".#.",
                ],
                [
                    "...",
                    "#X#",
                    "..#",
                ],
                [
                    ".#.",
                    ".X.",
                    "##.",
                ],
            ]),

        "L": make_offsets([
            [
                "..#",
                "#X#",
                "...",
            ],
            [
                ".#.",
                ".X.",
                ".##",
            ],
            [
                "...",
                "#X#",
                "#..",
            ],
            [
                "##.",
                ".X.",
                ".#.",
            ],
        ]),

        "O": make_offsets([
            [
                "##",
                "X#",
            ]
        ]),

        "S": make_offsets([
            [
                ".##",
                "#X.",
                "...",
            ],
            [
                ".#.",
                ".X#",
                "..#",
            ],
            [
                "...",
                ".X#",
                "##.",
            ],
            [
                "#..",
                "#X.",
                ".#.",
            ],
        ]),

        "T": make_offsets([
            [
                ".#.",
                "#X#",
                "...",
            ],
            [
                ".#.",
                ".X#",
                ".#.",
            ],
            [
                "...",
                "#X#",
                ".#.",
            ],
            [
                ".#.",
                "#X.",
                ".#.",
            ],
        ]),

        "Z": make_offsets([
            [
                "##.",
                ".X#",
                "...",
            ],
            [
                "..#",
                ".X#",
                ".#.",
            ],
            [
                "...",
                "#X.",
                ".##",
            ],
            [
                ".#.",
                "#X.",
                "#..",
            ],
        ]),
    }

    // kick_map determines which offsets are tested when a rotation fails.
    // kick_map maps the current rotation_index and the desired direction to a sequence of kick values.
    // Refer: https://tetris.wiki/Super_Rotation_System
    const kick_map = {
        "test": {
            0: {
                "left": [{ i: 0, j: 0 }, { i: 1, j: 0 }],
                "right": [{ i: 0, j: 0 }, { i: -1, j: 0 }]
            },
            1: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: -1 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: 1 }]
            },
            2: {
                "left": [{ i: 0, j: 0 }, { i: -1, j: 0 }],
                "right": [{ i: 0, j: 0 }, { i: 1, j: 0 }]
            },
            3: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: 1 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: -1 }]
            }
        },
        "I": {
            0: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: -1 }, { i: 0, j: 2 }, { i: -2, j: -1 }, { i: 1, j: 2 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: -2 }, { i: 0, j: 1 }, { i: 1, j: -2 }, { i: -2, j: 1 }]
            },
            1: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: 2 }, { i: 0, j: -1 }, { i: -1, j: 2 }, { i: 2, j: -1 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: -1 }, { i: 0, j: 2 }, { i: -2, j: -1 }, { i: 1, j: 2 }]
            },
            2: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: 1 }, { i: 0, j: -2 }, { i: 2, j: 1 }, { i: -1, j: -2 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: 2 }, { i: 0, j: -1 }, { i: -1, j: 2 }, { i: 2, j: -1 }]
            },
            3: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: -2 }, { i: 0, j: 1 }, { i: 1, j: -2 }, { i: -2, j: 1 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: 1 }, { i: 0, j: -2 }, { i: 2, j: 1 }, { i: -1, j: -2 }]
            }
        },
        "J": {
            0: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: 1 }, { i: -1, j: 1 }, { i: 2, j: 0 }, { i: 2, j: 1 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: -1 }, { i: -1, j: -1 }, { i: 2, j: 0 }, { i: 2, j: -1 }]
            },
            1: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: 1 }, { i: 1, j: 1 }, { i: -2, j: 0 }, { i: -2, j: 1 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: 1 }, { i: 1, j: 1 }, { i: -2, j: 0 }, { i: -2, j: 1 }]
            },
            2: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: -1 }, { i: -1, j: -1 }, { i: 2, j: 0 }, { i: 2, j: -1 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: 1 }, { i: -1, j: 1 }, { i: 2, j: 0 }, { i: 2, j: 1 }]
            },
            3: {
                "left": [{ i: 0, j: 0 }, { i: 0, j: -1 }, { i: 1, j: -1 }, { i: -2, j: 0 }, { i: -2, j: -1 }],
                "right": [{ i: 0, j: 0 }, { i: 0, j: -1 }, { i: 1, j: -1 }, { i: -2, j: 0 }, { i: -2, j: -1 }]
            }
        },
        "O": {
            0: {
                "left": [{ i: 0, j: 0 }],
                "right": [{ i: 0, j: 0 }],
            },
            1: {
                "left": [{ i: 0, j: 0 }],
                "right": [{ i: 0, j: 0 }],
            },
            2: {
                "left": [{ i: 0, j: 0 }],
                "right": [{ i: 0, j: 0 }],
            },
            3: {
                "left": [{ i: 0, j: 0 }],
                "right": [{ i: 0, j: 0 }],
            }
        },
    };

    // JLSTZ all share the same kick values.
    kick_map["L"] = kick_map["J"];
    kick_map["S"] = kick_map["J"];
    kick_map["T"] = kick_map["J"];
    kick_map["Z"] = kick_map["J"];

    // get_coordinates returns the coordinates of the tetrimino that are currently filled.
    obj.get_coordinates = function () {
        if (obj.type in rotation_map) {
            const offsets = rotation_map[obj.type][obj.rotation_index];
            let coords = [];
            offsets.forEach((off) => {
                coords.push({ i: obj.i + off.i, j: obj.j + off.j });
            });
            return coords;
        } else {
            console.assert("Don't know how to get_coordinates for type: %s", obj.type);
        }
    };

    obj.get_lowest_i = function () {
        const coords = obj.get_coordinates();
        let max = coords[0].i;
        for (let i = 1; i < coords.length; i++) {
            const pair = coords[i];
            if (pair.i > max) {
                max = pair.i;
            }
        }
        return max;
    }

    obj.get_height = function () {
        const coords = obj.get_coordinates();
        let min = coords[0].i;
        let max = coords[0].i;
        for (let i = 1; i < coords.length; i++) {
            const pair = coords[i];
            if (pair.i < min) {
                min = pair.i;
            }
            if (pair.i > max) {
                max = pair.i;
            }
        }
        console.assert(max >= min);
        return 1 + max - min;
    }

    obj.get_width = function () {
        const coords = obj.get_coordinates();
        let min = coords[0].j;
        let max = coords[0].j;
        for (let i = 1; i < coords.length; i++) {
            const pair = coords[i];
            if (pair.j < min) {
                min = pair.j;
            }
            if (pair.j > max) {
                max = pair.j;
            }
        }
        console.assert(max >= min);
        return 1 + max - min;
    }

    obj.get_rotations = function () {
        console.assert(obj.type in rotation_map);
        return rotation_map[obj.type];
    };

    obj.get_kicks = function (dir) {
        console.assert(obj.rotation_index in kick_map[obj.type]);
        console.assert(dir in kick_map[obj.type][obj.rotation_index]);
        return kick_map[obj.type][obj.rotation_index][dir];
    };

    obj.get_type = function () {
        return obj.type;
    }

    obj.get_front_corners = function () {
        console.assert(obj.type == "T");
        switch (obj.rotation_index) {
            case 0:
                return [{ i: obj.i - 1, j: obj.j - 1 }, { i: obj.i - 1, j: obj.j + 1 }];
            case 1:
                return [{ i: obj.i - 1, j: obj.j + 1 }, { i: obj.i + 1, j: obj.j + 1 }];
            case 2:
                return [{ i: obj.i + 1, j: obj.j - 1 }, { i: obj.i + 1, j: obj.j + 1 }];
            case 3:
                return [{ i: obj.i + 1, j: obj.j - 1 }, { i: obj.i - 1, j: obj.j - 1 }];
            default:
                console.assert(false, "unexpected rotation index: %d", rotation_index);
        }
    }

    obj.get_back_corners = function () {
        console.assert(obj.type == "T");
        switch (obj.rotation_index) {
            case 0:
                return [{ i: obj.i + 1, j: obj.j - 1 }, { i: obj.i + 1, j: obj.j + 1 }];
            case 1:
                return [{ i: obj.i - 1, j: obj.j - 1 }, { i: obj.i + 1, j: obj.j - 1 }];
            case 2:
                return [{ i: obj.i - 1, j: obj.j - 1 }, { i: obj.i - 1, j: obj.j + 1 }];
            case 3:
                return [{ i: obj.i - 1, j: obj.j + 1 }, { i: obj.i + 1, j: obj.j + 1 }];
            default:
                console.assert(false, "unexpected rotation index: %d", rotation_index);
        }
    }

    return obj;
}

function game_make(opts) {
    opts = opts || {};
    const game_opts = opts;
    const obj = {};
    // tetrimino is the active tetrimino.
    let tetrimino = null;
    let grid = grid_make(opts.grid || {});
    let gravity_counter = 0;
    const kMSPerFrame = opts.kMSPerFrame || 1000 / 60;
    let lock_timer_ms = 0;
    let locking = false;
    let lock_delay_reset_counter = 0;
    // locking_row is the row collided when entering the locking state.
    // If a tetrimino moves past this row, locking resets.
    let locking_row = 0;
    const kDASDelayFrames = 10;
    let das_delay_frame_countdown = 0;
    const kDASRepeatFrames = 3;
    let das_repeat_frame_countdown = 0;
    const kDASNone = 0, kDASWantRight = 1, kDASRight = 2, kDASWantLeft = 3, kDASLeft = 4;
    let das_state = kDASNone;
    let total_lines_cleared = 0;
    let cleared_300 = false;
    let has_lost = false;
    const kEntryDelayFrames = 6;
    let entry_delay_counter = 0;
    let hold_tetrimino_type = null;
    // hold_lock is true when a tetrimino has been put in hold.
    // When hold_lock is true, another tetrimino cannot be put in hold until the current tetrimino locks.
    let hold_lock = false;
    // score_message is set to the most recent score message.
    let score_message = "";
    // score_value is set to the most recent score value excluding hard/soft drop.
    let score_value = 0;
    // score_occurred is true for the first frame a score occurs excluding hard/soft drop.
    let score_occurred = false;
    let score_total = 0;
    // score_did_rotate_last tracks if the last maneuver was a rotation.
    // This is used to determine T-Spin: "The last maneuver of the T tetrimino must be a rotation."
    let score_did_rotate_last = false;
    // score_last_kick_applied tracks the last kick applied to a rotation.
    // This is used to determine T-Spin: "if the last rotation that kicked the T moves its center 1 by 2 blocks (the last rotation offset of SRS), it is still a proper T-spin."
    let score_last_kick_applied = { i: 0, j: 0 };
    let score_back_to_back_eligible = false;
    let combo_counter = -1;
    let spawn_shuffle = [];
    let ghost_piece = null;

    obj.reset = function() {
        tetrimino = null;
        grid = grid_make(opts.grid || {});
        gravity_counter = 0;
        lock_timer_ms = 0;
        locking = false;
        lock_delay_reset_counter = 0;
        locking_row = 0;
        das_delay_frame_countdown = 0;
        das_repeat_frame_countdown = 0;
        das_state = kDASNone;
        total_lines_cleared = 0;
        cleared_300 = false;
        has_lost = false;
        entry_delay_counter = 0;
        hold_tetrimino_type = null;
        hold_lock = false;
        score_message = "";
        score_value = 0;
        score_occurred = false;
        score_total = 0;
        score_did_rotate_last = false;
        score_last_kick_applied = { i: 0, j: 0 };
        score_back_to_back_eligible = false;
        combo_counter = -1;
        spawn_shuffle = [];
        ghost_piece = null;
    };

    let last_n_renders = [];
    obj.get_debug_info = function () {
        return {
            level: this.get_level(),
            last_n_renders: last_n_renders
        };
    }

    obj.get_score_message = function () {
        return score_message;
    }

    // get_score_value returns the most recent score value.
    obj.get_score_value = function () {
        return score_value;
    };

    obj.get_score_total = function () {
        return score_total;
    };

    obj.get_score_occurred = function () {
        return score_occurred;
    }

    obj.get_entry_delay_frames = function () {
        return kEntryDelayFrames;
    }

    obj.get_has_lost = function () {
        return has_lost;
    }

    obj.get_level = function () {
        if (opts.fixed_level) {
            return opts.fixed_level;
        }
        // Level increases every 10 lines cleared.
        return 1 + Math.floor(total_lines_cleared / 10);
    }

    obj.is_ended = function () {
        return total_lines_cleared >= 300;
    }

    obj.get_gravity = function () {
        if (opts.fixed_gravity) {
            return opts.fixed_gravity;
        }
        // When the level increases, so does the gravity.
        // The gravity reaches its maximum 20G at level 20.
        const level = obj.get_level();
        if (level >= 20) {
            return 20;
        }
        const g_map = {
            // Values 1-15 are copied from: https://harddrop.com/wiki/Tetris_Worlds
            1: 0.01667,
            2: 0.021017,
            3: 0.026977,
            4: 0.035256,
            5: 0.04693,
            6: 0.06361,
            7: 0.0879,
            8: 0.1236,
            9: 0.1775,
            10: 0.2598,
            11: 0.388,
            12: 0.59,
            13: 0.92,
            14: 1.46,
            15: 2.36,
            // Values 15-18 are computed from (0.8-((Level-1)*0.007))(Level-1)
            16: 3.9090991031125726,
            17: 6.613536242572853,
            18: 11.437940870718618,
            // Value 19 is a fixed "20" since result of formula is greater than 20.
            19: 20
        }
        console.assert(level in g_map);
        return g_map[level];
    }

    function get_lock_delay_ms() {
        // Values copied from https://www.reddit.com/r/Tetris/comments/e1ov09/comment/f8s4n31/?utm_source=share&utm_medium=web2x&context=3
        // Assuming levels are offset by one.
        const level = obj.get_level();
        if (level <= 20) {
            return 500;
        }
        const lock_delay_map = {
            21: 450,
            22: 400,
            23: 350,
            24: 300,
            25: 250,
            26: 200,
            27: 190,
            28: 180,
            29: 170,
            30: 160,
            31: 150
        }
        console.assert(level in lock_delay_map);
        return lock_delay_map[level];
    }

    // is_colliding_below returns true if tetrimino has a filled cell or floor below.
    function is_colliding_below(t) {
        if (!t) {
            // Default to current tetrimino.
            console.assert(tetrimino);
            t = tetrimino;
        }
        const coords = t.get_coordinates();
        for (let i = 0; i < coords.length; i++) {
            const pair = coords[i];
            if (pair.i + 1 == grid.nrows()) {
                return true;
            }
            if (grid.has(pair.i + 1, pair.j)) {
                const cell = grid.get(pair.i + 1, pair.j);
                if (cell.filled) {
                    return true;
                }
            }
        }
        return false;
    }

    // try_rotate tries to rotate in direction `dir`.
    // All kicks are tried in sequence. If all kicks fail, rotation does not occur.
    // Returns true if rotation applied.
    function try_rotate(dir) {
        console.assert(tetrimino);
        const t = tetrimino;
        console.assert(dir == "left" || dir == "right", "expected 'left' or 'right', got %s", dir);
        const rotations = t.get_rotations();
        let target_index = dir == "right" ? t.rotation_index + 1 : t.rotation_index - 1;
        if (target_index < 0) {
            target_index = rotations.length - 1;
        } else if (target_index > rotations.length - 1) {
            target_index = 0;
        }

        // can_rotate checks if applying `kick` results in a successful rotation.
        function can_rotate(kick) {
            const rotation = rotations[target_index];
            let all_empty = true;
            for (let i = 0; i < rotation.length; i++) {
                const pair = {
                    i: t.i + kick.i + rotation[i].i,
                    j: t.j + kick.j + rotation[i].j,
                };
                if (!grid.has(pair.i, pair.j)) {
                    all_empty = false;
                    break;
                }
                if (grid.get(pair.i, pair.j).filled) {
                    all_empty = false;
                    break;
                }
            }
            return all_empty;
        }

        // Try to apply each kick in sequence until rotation succeeds.
        let kick_to_apply = null;
        const kicks = t.get_kicks(dir);
        for (let i = 0; i < kicks.length; i++) {
            const kick = kicks[i];
            if (can_rotate(kick)) {
                kick_to_apply = kick;
                break;
            }
        }

        if (kick_to_apply === null) {
            return false;
        }

        score_last_kick_applied = kick_to_apply;
        // Apply kick to position.
        t.i += kick_to_apply.i;
        t.j += kick_to_apply.j;
        // Apply rotation.
        t.rotation_index = target_index;
        return true;
    }

    // try_move tries to move tetrimino in direction `dir`. Returns true if move applied.
    function try_move(dir) {
        console.assert(tetrimino);
        const t = tetrimino;

        let j;
        if (dir == "left") {
            j = -1;
        }
        else if (dir == "right") {
            j = +1;
        }
        else {
            throw "Do not know how to move in direction '" + dir + "'";
        }

        const coords = t.get_coordinates();
        for (let i = 0; i < coords.length; i++) {
            const pair = coords[i];
            if (!grid.has(pair.i, pair.j + j)) {
                return false;
            }
            const cell = grid.get(pair.i, pair.j + j);
            if (cell.filled) {
                return false;
            }
        }
        // All destination cells are clear. Apply move.
        t.j += j;
        return true;
    }


    let events = {};

    function clear_events() {
        events = {
            rotate_left: false,
            rotate_right: false,
            move_left: false,
            move_right: false,
            hard_drop: false,
            soft_drop: false,
            hold: false
        }
    }

    clear_events();

    obj.add_tetrimino = function (t) {
        console.assert(tetrimino == null);
        tetrimino = t;
    };

    function shuffle(arr) {
        for (let src = 0; src < arr.length; src++) {
            let dst = Math.floor(Math.random() * arr.length);
            let tmp = arr[src];
            arr[src] = arr[dst];
            arr[dst] = tmp;
        }
    }
    obj.spawn_tetrimino = function (opts) {
        let tetrimino_type;
        if (opts && opts.tetrimino_type) {
            tetrimino_type = opts.tetrimino_type;
        }
        else if (game_opts.grid && game_opts.grid.use_test_grid) {
            // Spawn a test piece.
            tetrimino_type = "test";
        } else {
            const types = "ISZTOJL".split("");
            while (spawn_shuffle.length < types.length * 2) {
                shuffle(types);
                types.forEach((type) => {
                    spawn_shuffle.push(type);
                })
            }
            tetrimino_type = spawn_shuffle.shift(1);
        }
        let start_i;
        let start_j;

        switch (tetrimino_type) {
            case "test":
                start_i = 0;
                start_j = 1;
                break;
            case "I":
                start_i = 0;
                start_j = 4;
                break;
            case "J":
            case "L":
            case "S":
            case "Z":
            case "T":
                start_i = 0;
                start_j = 4;
                break;
            case "O":
                start_i = 0;
                start_j = 4;
                break;
            default:
                console.assert(false, "do not know how to spawn tetrimino type: %s", tetrimino_type);
                return;
        }

        if (game_opts.grid && game_opts.grid.use_test_grid) {
            start_j = 1;
        }

        const t = tetrimino_make({
            type: tetrimino_type,
            i: start_i,
            j: start_j
        });

        const coords = t.get_coordinates();
        for (let i = 0; i < coords.length; i++) {
            const pair = coords[i];
            if (grid.get(pair.i, pair.j).filled) {
                // The player tops out when a piece is spawned overlapping at least one block
                has_lost = true;
                return;
            }
        }
        obj.add_tetrimino(t);

        // Attempt to move down immediately.
        if (!is_colliding_below()) {
            t.i++;
        }
        // Reset gravity counter.
        gravity_counter = 0;

        // If in DAS, reset repeat_frame_countdown. This agrees with observed behavior on tetris.com.
        if (das_state == kDASLeft || das_state == kDASRight) {
            das_repeat_frame_countdown = kDASRepeatFrames;
        }

        // Reset T-Spin eligibility.
        score_did_rotate_last = false;
    }

    function try_spawn() {
        if (tetrimino) return;
        if (game_opts.grid && game_opts.grid.use_test_grid && !game_opts.enable_spawn) return;
        entry_delay_counter++;
        if (entry_delay_counter >= kEntryDelayFrames) {
            obj.spawn_tetrimino();
            entry_delay_counter = 0;
        }
    }

    obj.rotate_left = function () {
        events.rotate_left = true;
    };

    obj.rotate_right = function () {
        events.rotate_right = true;
    };

    obj.move_left = function () {
        events.move_left = true;
    };

    obj.move_right = function () {
        events.move_right = true;
    };

    obj.hard_drop = function () {
        events.hard_drop = true;
    }

    obj.soft_drop = function () {
        events.soft_drop = true;
    }

    obj.hold = function () {
        events.hold = true;
    }
    obj.tick_frame = function () {
        try_spawn();

        score_occurred = false;
        let t = tetrimino;
        let in_soft_drop = false;
        let did_move = false;
        let did_rotate = false;

        // Handle events.
        key_states_apply();
        if (events.rotate_left) {
            if (t) {
                if (try_rotate("left")) {
                    did_rotate = true;
                }
            }
        }
        if (events.rotate_right) {
            if (t) {
                if (try_rotate("right")) {
                    did_rotate = true;
                }
            }
        }
        if (events.move_left) {
            // Handle Delayed Auto Shift (DAS)
            switch (das_state) {
                case kDASRight:
                case kDASWantRight:
                case kDASNone:
                    // User was moving right or not moving. Make immediate move and start DAS sequence.
                    if (t) {
                        if (try_move("left")) {
                            did_move = true;
                        }
                    }
                    das_state = kDASWantLeft;
                    das_delay_frame_countdown = kDASDelayFrames;
                    break;
                case kDASWantLeft:
                    das_delay_frame_countdown--;
                    if (das_delay_frame_countdown <= 0) {
                        // Delay has completed. Begin repeating.
                        if (t) {
                            if (try_move("left")) {
                                did_move = true;
                            }
                        }
                        das_state = kDASLeft;
                        das_repeat_frame_countdown = kDASRepeatFrames;
                    }
                    break;
                case kDASLeft:
                    das_repeat_frame_countdown--;
                    if (das_repeat_frame_countdown <= 0) {
                        if (t) {
                            if (try_move("left")) {
                                did_move = true;
                            }
                        }
                        das_repeat_frame_countdown = kDASRepeatFrames;
                    }
                    break;
            }
        }
        if (events.move_right) {
            // Handle Delayed Auto Shift (DAS)
            switch (das_state) {
                case kDASLeft:
                case kDASWantLeft:
                case kDASNone:
                    // User was moving left or not moving. Make immediate move and start DAS sequence.
                    if (t) {
                        if (try_move("right")) {
                            did_move = true;
                        }
                    }
                    das_state = kDASWantRight;
                    das_delay_frame_countdown = kDASDelayFrames;
                    break;
                case kDASWantRight:
                    das_delay_frame_countdown--;
                    if (das_delay_frame_countdown <= 0) {
                        // Delay has completed. Begin repeating.
                        if (t) {
                            if (try_move("right")) {
                                did_move = true;
                            }
                        }
                        das_state = kDASRight;
                        das_repeat_frame_countdown = kDASRepeatFrames;
                    }
                    break;
                case kDASRight:
                    das_repeat_frame_countdown--;
                    if (das_repeat_frame_countdown <= 0) {
                        if (t) {
                            if (try_move("right")) {
                                did_move = true;
                            }
                        }
                        das_repeat_frame_countdown = kDASRepeatFrames;
                    }
                    break;
            }
        }

        if (!events.move_left && !events.move_right) {
            das_state = kDASNone;
        }

        // did_hard_drop_cells is the number of cells moved down for a hard drop.
        let did_hard_drop_cells = 0;
        if (events.hard_drop) {
            if (t) {
                while (!is_colliding_below()) {
                    t.i++;
                    did_hard_drop_cells += 1;
                }
                locking = true;
                lock_timer_ms = 0; // Lock this frame.
            }
        }
        if (events.soft_drop) {
            in_soft_drop = true;
        }

        if (events.hold) {
            if (!hold_lock) {
                hold_lock = true;
                const prev_hold_tetrimino_type = hold_tetrimino_type;
                hold_tetrimino_type = tetrimino.get_type();
                tetrimino = null;
                t = null;
                // Immediately spawn next.
                if (prev_hold_tetrimino_type) {
                    obj.spawn_tetrimino({ tetrimino_type: prev_hold_tetrimino_type });
                } else {
                    obj.spawn_tetrimino();
                }
            }
        }

        clear_events();

        if (t) {
            // The player tops out when a block is pushed above the 20-row buffer zone.
            const coords = t.get_coordinates();
            for (let i = 0; i < coords.length; i++) {
                const pair = coords[i];
                if (!grid.has(pair.i, pair.j)) {
                    has_lost = true;
                    // Remove tetrimino.
                    tetrimino = null;
                    t = null;
                }
            }

        }

        // Apply gravity.
        // Tetriminos move at a rate of `gravity` cells per frame.
        let applied_gravity = false;
        if (t) {
            let gravity = obj.get_gravity();
            if (is_colliding_below()) {
                gravity_counter = 0;
            } else {
                // From https://tetris.wiki/Drop
                // "Soft dropping a tetromino generally makes it falls at around 20 to 60 blocks per second, as fast as or faster than DAS"
                // tetris.com appears to use the same speed as DAS. Default DAS is 50ms.
                // 50ms is .3 frames.
                if (in_soft_drop && gravity < .3) {
                    gravity_counter += .3;
                } else {
                    gravity_counter += gravity;
                }

                while (gravity_counter >= 1) {
                    if (!is_colliding_below()) {
                        t.i++;
                        applied_gravity = true;
                    }
                    gravity_counter -= 1;
                    if (gravity_counter < 0) {
                        gravity_counter = 0;
                    }
                }
            }
        }

        // Check locking state.
        if (t) {
            if (locking) {
                // Reset locking if tetrimino moved below the row it started locking.
                if (applied_gravity && t.get_lowest_i() > locking_row) {
                    locking = false;
                }
            }

            if (locking) {
                // From https://harddrop.com/wiki/Tetris_at_tetris.com:
                // "The game uses move-reset lock delay. That means every time a piece is moved or rotated, lock delay is reset and the piece is still active until the delay runs out (or the piece is moved or rotated 15 times before descending)."
                if (did_move || did_rotate) {
                    // "With move reset, this is limited to 15 moves/rotations"
                    lock_delay_reset_counter++;
                    lock_timer_ms = get_lock_delay_ms() + kMSPerFrame;
                    // From https://tetris.wiki/Tetris_Guideline
                }
            }

            // Start locking if tetrimino is colliding below.
            if (!locking) {
                if (is_colliding_below()) {
                    locking = true;
                    locking_row = t.get_lowest_i();
                    lock_timer_ms = get_lock_delay_ms() + kMSPerFrame; // Add 1 frame so locking state excludes current frame.
                    lock_delay_reset_counter = 0;
                }
            }

            // Reset lock timer when not colliding below.
            if (locking) {
                if (!is_colliding_below()) {
                    lock_timer_ms = get_lock_delay_ms() + kMSPerFrame; // Add 1 frame so locking state excludes current frame.
                }
            }
        }

        // Apply lock.
        let fill_occurred = false;
        // Store tetrimino for scoring evaluation later in the frame.
        let score_tetrimino = null;
        if (t) {
            score_tetrimino = t;
        }
        if (locking) {
            lock_timer_ms -= kMSPerFrame;
            if (is_colliding_below() && (lock_timer_ms <= 0 || lock_delay_reset_counter >= 15)) {
                let is_visible = false;
                // Fill cells with tetrimino.
                const coords = t.get_coordinates();
                for (let i = 0; i < coords.length; i++) {
                    const pair = coords[i];
                    const cell = grid.get(pair.i, pair.j);
                    cell.filled = true;
                    if (grid.has_visible(pair.i, pair.j)) {
                        is_visible = true;
                    }
                }
                if (!is_visible) {
                    // The player tops out when a piece locks completely above the visible portion of the playfield.
                    has_lost = true;
                }
                // Reset tetrimino.
                tetrimino = null;
                t = null;
                fill_occurred = true;
                hold_lock = false;
                locking = false;
            }
        }

        // Check for T-Spin before clearing lines.
        const kTSpinNone = 0;
        const kTSpinMini = 1;
        const kTSpin = 2;
        let t_spin_type = kTSpinNone;
        if (score_tetrimino) {
            // Determine if tetrimino is eligible for a T-Spin.
            // "The last maneuver of the T tetrimino must be a rotation."
            if (did_rotate) {
                score_did_rotate_last = true;
            }
            if (applied_gravity) {
                score_did_rotate_last = false;
            }
            if (did_move) {
                score_did_rotate_last = false;
            }
            if (did_hard_drop_cells) {
                score_did_rotate_last = false;
            }

            if (fill_occurred) {
                // Check for T-Spin.
                if (score_tetrimino.get_type() == "T" && score_did_rotate_last) {
                    const fcs = score_tetrimino.get_front_corners();
                    console.assert(fcs.length == 2);
                    let fcs_filled = 0;
                    fcs.forEach((fc) => {
                        if (!grid.has(fc.i, fc.j) || grid.get(fc.i, fc.j).filled) {
                            fcs_filled++;
                        }
                    });

                    const bcs = score_tetrimino.get_back_corners();
                    console.assert(bcs.length == 2);
                    let bcs_filled = 0;
                    bcs.forEach((bc) => {
                        if (!grid.has(bc.i, bc.j) || grid.get(bc.i, bc.j).filled) {
                            bcs_filled++;
                        }
                    });

                    // Check if mini T-Spin or T-Spin.
                    if (fcs_filled == 2 && bcs_filled >= 1) {
                        // "If there are two minoes in the front corners of the 3 by 3 square occupied by the T (the front corners are ones next to the sticking out mino of the T) and at least one mino in the two other corners (to the back), it is a \"proper\" T-spin."
                        t_spin_type = kTSpin;
                    } else {
                        // "Otherwise, if there is only one mino in two front corners and two minoes to the back corners, it is a Mini T-spin. However, if the last rotation that kicked the T moves its center 1 by 2 blocks (the last rotation offset of SRS), it is still a proper T-spin."
                        if (fcs_filled == 1 && bcs_filled == 2) {
                            t_spin_type = kTSpinMini;
                            if (Math.abs(score_last_kick_applied.i) == 1 && Math.abs(score_last_kick_applied.j) == 2) {
                                t_spin_type = kTSpin;
                            }
                        }
                    }
                }
            }
        }

        // Check for line clears.
        let lines_cleared = 0;
        if (fill_occurred) {
            for (let i = 0; i < grid.nrows(); i++) {
                let can_be_cleared = true;
                for (let j = 0; j < grid.ncols(); j++) {
                    if (!grid.get(i, j).filled) {
                        can_be_cleared = false;
                        break;
                    }
                }
                if (can_be_cleared) {
                    // Clear, and shift cell fills down.
                    for (let ip = i; ip >= 0; ip--) {
                        for (let jp = 0; jp < grid.ncols(); jp++) {
                            const to = grid.get(ip, jp);
                            if (ip == 0) {
                                to.filed = false;
                            } else {
                                const from = grid.get(ip - 1, jp);
                                to.filled = from.filled;
                            }
                        }
                    }
                    lines_cleared++;
                }
            }

            if (lines_cleared > 0) {
                total_lines_cleared += lines_cleared;
            }
        }

        // Apply scoring.
        {
            // difficult is true if the action is considered "Difficult" by https://tetris.wiki/Scoring
            // difficult actions are eligible for the back-to-back.
            let difficult = false;

            if (t_spin_type != kTSpinNone) {
                difficult = true;
            }
            if (fill_occurred) {
                score_value = 0;
                score_message = "";
                const level = obj.get_level();

                // Apply score and construct message.
                if (t_spin_type == kTSpin) {
                    score_message = "T-Spin";
                    switch (lines_cleared) {
                        case 0:
                            score_value = 400 * level;
                            break;
                        case 1:
                            score_message += " Single";
                            score_value = 800 * level;
                            difficult = true;
                            break;
                        case 2:
                            score_message += " Double";
                            score_value = 1200 * level;
                            difficult = true;
                            break;
                        case 3:
                            score_message += " Triple";
                            score_value = 1600 * level;
                            difficult = true;
                            break;
                        default:
                            console.assert(false, "Unexpected lines cleared %d while scoring T-Spin", lines_cleared);
                            break;
                    }
                }
                else if (t_spin_type == kTSpinMini) {
                    score_message = "Mini T-Spin";
                    switch (lines_cleared) {
                        case 0:
                            score_value = 100 * level;
                            break;
                        case 1:
                            score_message += " Single";
                            score_value = 200 * level;
                            difficult = true;
                            break;
                        case 2:
                            score_message += " Double";
                            score_value = 400 * level;
                            difficult = true;
                            break;
                        default:
                            console.assert(false, "Unexpected lines cleared %d while scoring Mini T-Spin", lines_cleared);
                            break;
                    }
                } else {
                    console.assert(t_spin_type == kTSpinNone);
                    switch (lines_cleared) {
                        case 0:
                            break;
                        case 1:
                            score_message = "Single";
                            score_value = 100 * level;
                            // Break the Back-to-Back chain.
                            score_back_to_back_eligible = false;
                            break;
                        case 2:
                            score_message = "Double";
                            score_value = 300 * level;
                            // Break the Back-to-Back chain.
                            score_back_to_back_eligible = false;
                            break;
                        case 3:
                            score_message = "Triple";
                            score_value = 500 * level;
                            // Break the Back-to-Back chain.
                            score_back_to_back_eligible = false;
                            break;
                        case 4:
                            score_message = "Tetris";
                            score_value = 800 * level;
                            difficult = true;
                            break;
                        default:
                            console.assert(false, "Unexpected lines cleared %d while scoring", lines_cleared);
                            break;
                    }
                }
                if (difficult) {
                    if (score_back_to_back_eligible) {
                        score_message = "Back-to-Back " + score_message;
                        score_value *= 1.5;
                    }
                    score_back_to_back_eligible = true;
                }

                // Apply combo counter.
                if (lines_cleared > 0) {
                    combo_counter += 1;
                    if (combo_counter > 0) {
                        score_value += 50 * combo_counter * level;
                        score_message += " Combo " + combo_counter;
                    }
                } else {
                    combo_counter = -1;
                }

                if (score_value != 0) {
                    score_occurred = true;
                }
                score_total += score_value;
            } // if (fill_occurred)

            // Apply hard_drop and soft_drop score bonus.
            score_total += 2 * did_hard_drop_cells;
            if (in_soft_drop && applied_gravity) {
                score_total += 1;
            }
        }

        if (t) {
            ghost_piece = t.copy();
            while (!is_colliding_below(ghost_piece)) {
                ghost_piece.i++;
            }
        } else {
            ghost_piece = null;
        }

        // store current_render
        const current_render = this.render_text();
        if (last_n_renders.length == 0) {
            last_n_renders.push(current_render);
        } else {
            const previous_render = last_n_renders[last_n_renders.length - 1];
            if (previous_render != current_render) {
                last_n_renders.push(current_render);
            }
        }
        if (last_n_renders.length > 100) {
            last_n_renders.shift();
        }
    };

    // render_text renders the tetris game in text.
    // Used for testing.
    // F == Fill
    // # == Tetrimino
    // . == Empty
    obj.render_text = function (opts) {
        const text_grid = [];
        if (opts && opts.render_buffer) {
            for (let i = -1 * grid.nrows(); i < 0; i++) {
                const row = [];
                for (let j = 0; j < grid.ncols(); j++) {
                    const cell = grid.get(i, j);
                    if (cell.filled) {
                        row.push("F");
                    } else {
                        row.push(".");
                    }
                }
                text_grid.push(row);
            }
            // Add a row of `-` characters to separate buffer from visible.
            const row = [];
            for (let j = 0; j < grid.ncols(); j++) {
                row.push("-");
            }
            text_grid.push(row);
        }
        for (let i = 0; i < grid.nrows(); i++) {
            const row = [];
            for (let j = 0; j < grid.ncols(); j++) {
                const cell = grid.get(i, j);
                if (cell.filled) {
                    row.push("F");
                } else {
                    row.push(".");
                }
            }
            text_grid.push(row);
        }
        if (game_opts && game_opts.show_ghost_piece && ghost_piece) {
            const coords = ghost_piece.get_coordinates();
            coords.forEach((pair) => {
                let ip = pair.i;
                if (opts && opts.render_buffer) {
                    if (ip < 0) {
                        ip += grid.nrows();
                    } else {
                        ip += grid.nrows() + 1;
                    }
                }
                if (ip >= 0 && ip < text_grid.length && pair.j >= 0 && pair.j < text_grid[ip].length) {
                    text_grid[ip][pair.j] = "G";
                }
            });
        }

        let t = tetrimino;
        if (t) {
            const coords = t.get_coordinates();
            coords.forEach((pair) => {
                let ip = pair.i;
                if (opts && opts.render_buffer) {
                    if (ip < 0) {
                        ip += grid.nrows();
                    } else {
                        ip += grid.nrows() + 1;
                    }
                }
                if (ip >= 0 && ip < text_grid.length && pair.j >= 0 && pair.j < text_grid[ip].length) {
                    text_grid[ip][pair.j] = "#";
                }
            });
        }
        // Render to string.
        let ret = "";
        for (let i = 0; i < text_grid.length; i++) {
            if (i > 0) ret += "\n";
            ret += text_grid[i].join("");
        }
        return ret;
    };
    obj.get_grid = function () {
        // TODO: can I return a read-only view of an object?
        return grid;
    }

    let tick_counter_ms = 0;
    let prev_ms = null;
    let flash_score_message_counter_ms = 0;
    let flash_score_message = "";
    obj.loop = function (opts) {
        const curr_ms = Date.now();
        if (prev_ms === null) {
            prev_ms = curr_ms;
        }
        const delta_ms = curr_ms - prev_ms;
        prev_ms = curr_ms;
        tick_counter_ms += delta_ms;

        while (tick_counter_ms >= kMSPerFrame) {
            obj.tick_frame();
            tick_counter_ms -= kMSPerFrame;
        }

        if (opts && opts.render_text_element) {
            const text = obj.render_text();
            if (obj.get_score_occurred()) {
                flash_score_message_counter_ms = 1000;
            }
            if (flash_score_message_counter_ms > 0) {
                if (obj.get_score_value() > 0) {
                    flash_score_message = obj.get_score_message() + " " + obj.get_score_value();
                }
                flash_score_message_counter_ms -= kMSPerFrame;
            } else {
                flash_score_message = "";
            }
            if (obj.get_has_lost()) {
                flash_score_message = "Game over";
            }
            opts.render_text_element.innerText = "Level: " + obj.get_level() + "\n" + "Score: " + obj.get_score_total() + "\n" + flash_score_message + "\n" + text;
        }
        window.requestAnimationFrame(function () {
            obj.loop(opts);
        });
    }

    const kKeyDownArrow = 40;
    const kKeyLeftArrow = 37;
    const kKeyRightArrow = 39;
    const kKeyUpArrow = 38;
    const kKeySpace = 32;
    const kKeyC = 67;
    let key_states;
    function key_states_reset() {
        key_states = {};

        key_states[kKeyDownArrow] = { down: false, pressHandled: false };
        key_states[kKeyLeftArrow] = { down: false, pressHandled: false };
        key_states[kKeyRightArrow] = { down: false, pressHandled: false };
        key_states[kKeyUpArrow] = { down: false, pressHandled: false };
        key_states[kKeySpace] = { down: false, pressHandled: false };
        key_states[kKeyC] = { down: false, pressHandled: false };
    }
    key_states_reset();
    function key_states_apply() {
        if (key_states[kKeyDownArrow].down) obj.soft_drop();
        if (key_states[kKeySpace].down && !key_states[kKeySpace].pressHandled) {
            obj.hard_drop();
            key_states[kKeySpace].pressHandled = true;
        }
        if (key_states[kKeyLeftArrow].down) obj.move_left();
        if (key_states[kKeyRightArrow].down) obj.move_right();
        if (key_states[kKeyUpArrow].down && !key_states[kKeyUpArrow].pressHandled) {
            obj.rotate_right();
            key_states[kKeyUpArrow].pressHandled = true;
        }
        if (key_states[kKeyC].down && !key_states[kKeyC].pressHandled) {
            obj.hold();
            key_states[kKeyC].pressHandled = true;
        }
    }
    obj.register_event_listeners = function () {
        document.addEventListener("keydown", function (e) {
            if (!(e.keyCode in key_states)) {
                return;
            }
            key_states[e.keyCode].down = true;
        });
        document.addEventListener("keyup", function (e) {
            if (!(e.keyCode in key_states)) {
                return;
            }
            key_states[e.keyCode].down = false;
            key_states[e.keyCode].pressHandled = false;
        })

        // Clear key state on window blur.
        window.addEventListener("blur", function (e) {
            key_states_reset();
        });
    }
    return obj;
}

let copy_debug_info = null;
function main() {
    const game = game_make({ grid: { use_test_grid: false }, enable_spawn: true, show_ghost_piece: true });
    game.register_event_listeners();
    game.loop({
        render_text_element: document.querySelector("#display_text")
    });
    copy_debug_info = function() {
        console.log();
        const debug_info = game.get_debug_info();
        for (let i = 0; i < debug_info.last_n_renders.length; i++) {
            debug_info.last_n_renders[i] = debug_info.last_n_renders[i].split("\n");
        }
        copy(JSON.stringify(debug_info, null, "    "));
        console.log("Debug info is copied. Paste into a file. Upload the file to a GitHub issue to report a bug: https://github.com/kevinAlbs/tetris/issues");
    }
}
main();

console.log("To report a bug, copy debug info with: `copy_debug_info()`")