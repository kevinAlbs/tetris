function assert_rendered(game, expected, opts) {
    const got = game.render_text(opts);
    expected = expected.join("\n");
    console.assert(got == expected, "expected grid:\n%s\ngot grid:\n%s\n", expected, got);
}
function test_add_tetrimino() {
    const game = game_make({ grid: { use_test_grid: true } });
    game.add_tetrimino(tetrimino_make());
    assert_rendered(game,
        [
            ".##..",
            ".....",
            ".....",
            ".....",
            ".....",
            "....."
        ]);
}
function test_gravity() {
    const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: .5 });
    game.add_tetrimino(tetrimino_make());
    assert_rendered(game,
        [
            ".##..",
            ".....",
            ".....",
            ".....",
            ".....",
            "....."
        ]);
    game.tick_frame();
    assert_rendered(game,
        [
            ".##..",
            ".....",
            ".....",
            ".....",
            ".....",
            "....."
        ]);
    game.tick_frame();
    assert_rendered(game,
        [
            ".....",
            ".##..",
            ".....",
            ".....",
            ".....",
            "....."
        ]);
    // Test gravity > 1
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 2 });
        game.add_tetrimino(tetrimino_make());
        assert_rendered(game,
            [
                ".##..",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".##..",
                ".....",
                ".....",
                "....."
            ]);
    }
    // Test gravity resets if a tetrimino is moved from colliding below, to not colliding below.
    {

        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: .1 });
        game.add_tetrimino(tetrimino_make({ i: 4 }));
        game.get_grid().get(5, 2).filled = true;
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".##..",
                "..F.."
            ]);
        for (let i = 0; i < 9; i++) {
            game.tick_frame();
        }
        game.move_left();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                "##...",
                "..F.."
            ]);
        for (let i = 0; i < 9; i++) {
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    "##...",
                    "..F.."
                ]);
        }
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "##F.."
            ]);

    }
}
function test_lock() {
    const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
    game.add_tetrimino(tetrimino_make({ i: 4 }));
    assert_rendered(game,
        [
            ".....",
            ".....",
            ".....",
            ".....",
            ".##..",
            "....."
        ]);
    game.tick_frame();
    assert_rendered(game,
        [
            ".....",
            ".....",
            ".....",
            ".....",
            ".....",
            ".##.."
        ]);
    // Tick 29 frames.
    for (let i = 0; i < 29; i++) game.tick_frame();
    // Expect still not locked.
    assert_rendered(game,
        [
            ".....",
            ".....",
            ".....",
            ".....",
            ".....",
            ".##.."
        ]);
    // Wait another frame.
    game.tick_frame();
    // Expect locked.
    assert_rendered(game,
        [
            ".....",
            ".....",
            ".....",
            ".....",
            ".....",
            ".FF.."
        ]);

    // Test lock with high fixed_gravity.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 4 });
        game.add_tetrimino(tetrimino_make({ i: 4 }));
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".##..",
                "....."
            ]);
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".##.."
            ]);
        // Tick 29 frames.
        for (let i = 0; i < 29; i++) game.tick_frame();
        // Expect still not locked.
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".##.."
            ]);
        // Wait another frame.
        game.tick_frame();
        // Expect locked.
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".FF.."
            ]);
    }

    // Test after 20G, lock delay decreases 
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_level: 21 });
        const grid = game.get_grid();
        game.add_tetrimino(tetrimino_make({ i: 5 }));
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".##.."
            ]);
        // Expect lock delay after 27 frames.
        // Tick 26 frames.
        for (let i = 0; i < 27; i++) {
            game.tick_frame();
            // Expect still not locked.
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    ".##.."
                ]);
        }

        // Wait another frame.
        game.tick_frame();
        // Expect locked.
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".FF.."
            ]);
    }

    // Test move resets lock delay
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
        game.add_tetrimino(tetrimino_make({ i: 4 }));
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".##..",
                "....."
            ]);
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".##.."
            ]);
        // Tick 29 frames.
        for (let i = 0; i < 29; i++) game.tick_frame();
        // Expect still not locked.
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".##.."
            ]);
        game.move_left();
        game.tick_frame();
        // Expect not locked.
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "##..."
            ]);
        // Tick 29 frames.
        for (let i = 0; i < 29; i++) game.tick_frame();
        // Expect still not locked.
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "##..."
            ]);
        game.move_left();
        game.tick_frame();
        // Expect locked.
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "FF..."
            ]);
    }
    // Test locks after 15 moves.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
        game.add_tetrimino(tetrimino_make({ i: 4 }));
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".##..",
                "....."
            ]);
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".##.."
            ]);

        // Lock delay can be reset for 15 moves max.
        for (let i = 0; i < 14; i++) {
            if (i % 2 == 0) {
                game.move_left();
            } else {
                game.move_right();
            }
            game.tick_frame();
            if (i % 2 == 0) {
                assert_rendered(game,
                    [
                        ".....",
                        ".....",
                        ".....",
                        ".....",
                        ".....",
                        "##..."
                    ]);
            } else {
                assert_rendered(game,
                    [
                        ".....",
                        ".....",
                        ".....",
                        ".....",
                        ".....",
                        ".##.."
                    ]);
            }
        }
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".##.."
            ]);
        // Expect locked.
        game.move_left();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "FF..."
            ]);
    }
    // Tests locks after 15 rotations if next gravity application results in colliding below.
    // This is expected even if a rotation results in the tetrimino not colliding below.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 / 20 });
        game.add_tetrimino(tetrimino_make({ i: 4, j: 2 }));
        game.get_grid().get(5, 2).filled = true;
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                "..##.",
                "..F.."
            ]);
        // Rotate 15 times.
        for (let i = 0; i < 15; i++) {
            game.rotate_right();
            game.tick_frame();
        }
        assert_rendered(game,
            [
                ".....",
                ".....",
                "..#..",
                "..#..",
                ".....",
                "..F.."
            ]);
        // Rotate 2 more times. Expect immediate lock.
        for (let i = 0; i < 2; i++) {
            game.rotate_right();
            game.tick_frame();
        }
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                "..F..",
                "..F..",
                "..F.."
            ]);
    }
    // Tests does not lock after 15 rotations if tetrimino moves past previous locking row.
    // This is expected even if a rotation results in the tetrimino not colliding below.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 / 20 });
        game.add_tetrimino(tetrimino_make({ i: 4, j: 2 }));
        game.get_grid().get(5, 2).filled = true;
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                "..##.",
                "..F.."
            ]);
        // Rotate 15 times.
        for (let i = 0; i < 15; i++) {
            game.rotate_right();
            game.tick_frame();
        }
        assert_rendered(game,
            [
                ".....",
                ".....",
                "..#..",
                "..#..",
                ".....",
                "..F.."
            ]);
        // Rotate 2 more times. Expect immediate lock.
        game.move_left();
        // Wait for two gravity applications.
        for (let i = 0; i < 20 + 20; i++) {
            game.tick_frame();
        }
        // Expect no lock. 
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".#...",
                ".#F.."
            ]);
    }

}


function test_rotate() {
    // Test basic rotate.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        game.add_tetrimino(tetrimino_make({ i: 1 }));
        assert_rendered(game,
            [
                ".....",
                ".##..",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        game.rotate_right();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".#...",
                ".#...",
                ".....",
                ".....",
                "....."
            ]);
    }
    // Test wall kick.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        game.add_tetrimino(tetrimino_make({ i: 0, j: 0, rotation_index: 1 }));
        assert_rendered(game,
            [
                "#....",
                "#....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        game.rotate_right();
        game.tick_frame();
        assert_rendered(game,
            [
                "##...",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
    }
    // Test floor kick.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        game.add_tetrimino(tetrimino_make({ i: 5, j: 1, rotation_index: 0 }));
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".##.."
            ]);
        game.rotate_right();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".#...",
                ".#..."
            ]);
    }
    // Test failed rotation.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        grid.get(4, 1).filled = true;
        grid.get(5, 1).filled = true;
        game.add_tetrimino(tetrimino_make({ i: 4, j: 0, rotation_index: 1 }));
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                "#F...",
                "#F..."
            ]);
        game.rotate_left();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                "#F...",
                "#F..."
            ]);
    }
}

function test_line_clear() {
    function fill_region(grid, start, end) {
        console.assert(start.i <= end.i);
        console.assert(start.j <= end.j);
        for (let i = start.i; i <= end.i; i++) {
            for (let j = start.j; j <= end.j; j++) {
                grid.get(i, j).filled = true;
            }
        }
    }
    // Test single line clear.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
        const grid = game.get_grid();
        fill_region(grid, { i: 5, j: 0 }, { i: 5, j: 3 });
        game.add_tetrimino(tetrimino_make({ i: 3, j: 4, rotation_index: 1 }));
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                "....#",
                "....#",
                "FFFF."
            ]);
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                "....#",
                "FFFF#"
            ]);
        // Tick 30 frames to lock.
        for (let i = 0; i < 30; i++) {
            game.tick_frame();
        }
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "....F"
            ]);

    }
    // Test split clear (TODO: need more pieces).
    {

    }
}

function test_move() {
    // Test move left / right.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        game.add_tetrimino(tetrimino_make({ i: 0, j: 1, rotation_index: 0 }));
        assert_rendered(game,
            [
                ".##..",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        game.move_left();
        game.tick_frame();
        assert_rendered(game,
            [
                "##...",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        // Test that cannot move beyond wall.
        game.move_left();
        game.tick_frame();
        assert_rendered(game,
            [
                "##...",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        // Test that cannot move beyond wall.
        game.move_right();
        game.tick_frame();
        assert_rendered(game,
            [
                ".##..",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
    }
    // Test delayed auto shift.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        game.add_tetrimino(tetrimino_make({ i: 0, j: 3, rotation_index: 0 }));
        assert_rendered(game,
            [
                "...##",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        game.move_left();
        game.tick_frame();
        assert_rendered(game,
            [
                "..##.",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        // After 9 frames, no move has occurred yet.
        for (let i = 0; i < 9; i++) {
            game.move_left();
            game.tick_frame();
        }
        assert_rendered(game,
            [
                "..##.",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        // After 10th frame, enter Delayed Auto Shift.
        game.move_left();
        game.tick_frame();
        assert_rendered(game,
            [
                ".##..",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        // In Delayed Auto Shift, move every 3 frames.
        for (let i = 0; i < 2; i++) {
            game.move_left();
            game.tick_frame();
        }
        assert_rendered(game,
            [
                ".##..",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        game.move_left();
        game.tick_frame();
        assert_rendered(game,
            [
                "##...",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
    }
    // Delayed Auto Shift can be entered before piece is spawned.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();

        // Tick 11 frames to enter DAS. Tick 1 more frame to verify DAS counter resets on spawn.
        for (let i = 0; i < 11 + 1; i++) {
            game.move_left();
            game.tick_frame();
        }

        // Use spawn_tetrimino. spawn_tetrimino resets DAS frame repeat counter.
        game.spawn_tetrimino();
        // Expect exactly 3 frames until moving left.
        for (let i = 0; i < 3; i++) {
            assert_rendered(game,
                [
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    ".....",
                    "....."
                ]);
            game.move_left();
            game.tick_frame();
        }
        assert_rendered(game,
            [
                ".....",
                "##...",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
    }
    // Moving in both directions results in no move.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        game.spawn_tetrimino();
        assert_rendered(game,
            [
                ".....",
                ".##..",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        game.move_left();
        game.move_right();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".##..",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
    }
}

function test_hard_drop() {
    // Test move left / right.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        game.add_tetrimino(tetrimino_make({ i: 0, j: 1, rotation_index: 0 }));
        assert_rendered(game,
            [
                ".##..",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        game.hard_drop();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                ".FF.."
            ]);
    }
}

function test_soft_drop() {
    // Test basic soft drop.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        game.add_tetrimino(tetrimino_make({ i: 0, j: 1, rotation_index: 0 }));
        assert_rendered(game,
            [
                ".##..",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
        for (let i = 0; i < 3; i++) {
            game.soft_drop();
            game.tick_frame();
            assert_rendered(game,
                [
                    ".##..",
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    "....."
                ]);
        }
        game.soft_drop();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".##..",
                ".....",
                ".....",
                ".....",
                "....."
            ]);
    }
    // Test soft drop does not slow down high gravity.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
        const grid = game.get_grid();
        game.add_tetrimino(tetrimino_make({ i: 0, j: 1, rotation_index: 0 }));
        assert_rendered(game,
            [
                ".##..",
                ".....",
                ".....",
                ".....",
                ".....",
                "....."
            ]);

        game.soft_drop();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".##..",
                ".....",
                ".....",
                ".....",
                "....."
            ]);

    }
}
function test_levels() {
    // fill_bottom_row unfills all cells and fills all in bottom row except left-most.
    function fill_bottom_row(grid) {
        // Clear.
        for (let i = 0; i < grid.nrows(); i++) {
            for (let j = 0; j < grid.ncols(); j++) {
                const cell = grid.get(i, j);
                cell.filled = false;
            }
        }

        // Fill all in bottom row but bottom left.
        for (let j = 1; j < grid.ncols(); j++) {
            const cell = grid.get(grid.nrows() - 1, j);
            cell.filled = true;
        }
    }

    function clear_one_line(game) {
        // Assume no tetrimino is added.
        game.add_tetrimino(tetrimino_make({ i: 0, j: 0, rotation_index: 1 }));
        fill_bottom_row(game.get_grid());
        assert_rendered(game,
            [
                "#....",
                "#....",
                ".....",
                ".....",
                ".....",
                ".FFFF"
            ]);
        game.hard_drop();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "F...."
            ]);
    }

    // Test level increases every 10 lines cleared.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        for (let i = 0; i < 9; i++) {
            clear_one_line(game);
        }
        console.assert(game.get_level() == 1, "expected level 1, got %d", game.get_level());
        clear_one_line(game);
        console.assert(game.get_level() == 2, "expected level 2, got %d", game.get_level());
        for (let i = 0; i < 10; i++) {
            clear_one_line(game);
        }
        console.assert(game.get_level() == 3, "expected level 3, got %d", game.get_level());
    }
    // Test game ends at 300 lines cleared.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        for (let i = 0; i < 299; i++) {
            clear_one_line(game);
        }
        console.assert(!game.is_ended());
        clear_one_line(game);
        console.assert(game.is_ended());
    }
    // Test gravity caps at 20G.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        for (let i = 0; i < 19 * 10 - 1; i++) {
            clear_one_line(game);
        }
        console.assert(game.get_level() == 19, "expected level 19, got %d", game.get_level());
        console.assert(game.get_gravity() == 20, `expected gravity 20, got ${game.get_gravity()}`);
        clear_one_line(game);
        console.assert(game.get_level() == 20, "expected level 20, got %d", game.get_level());
        console.assert(game.get_gravity() == 20, `expected gravity 20, got ${game.get_gravity()}`);
        for (let i = 0; i < 10; i++) {
            clear_one_line(game);
        }
        console.assert(game.get_level() == 21, "expected level 21, got %d", game.get_level());
        console.assert(game.get_gravity() == 20, `expected gravity 20, got ${game.get_gravity()}`);
    }
}

function test_spawn() {
    {
        const game = game_make({ grid: { use_test_grid: true } });
        game.spawn_tetrimino();
        assert_rendered(game,
            [
                ".....",
                ".##..",
                ".....",
                ".....",
                ".....",
                "....."],
        );
    }
    // Spawn starts at row 0 if row 1 is filled.
    {
        const game = game_make({ grid: { use_test_grid: true } });
        const grid = game.get_grid();
        for (let i = 1; i < grid.nrows(); i++) {
            grid.get(i, 2).filled = true;
        }
        game.spawn_tetrimino();
        assert_rendered(game,
            [
                ".##..",
                "..F..",
                "..F..",
                "..F..",
                "..F..",
                "..F.."],
        );
    }
}

function test_loss() {
    // The player tops out when a piece is spawned overlapping at least one block.
    // Spawn starts at row 0 if row 1 is filled.
    {
        const game = game_make({ grid: { use_test_grid: true, fixed_gravity: 1 } });
        const grid = game.get_grid();
        for (let i = 1; i < grid.nrows(); i++) {
            grid.get(i, 2).filled = true;
        }
        game.spawn_tetrimino();
        assert_rendered(game,
            [
                ".##..",
                "..F..",
                "..F..",
                "..F..",
                "..F..",
                "..F.."],
        );
        console.assert(!game.get_has_lost());
        // Wait for lock.
        for (let i = 0; i < 30; i++) {
            game.tick_frame();
        }
        game.tick_frame();
        assert_rendered(game,
            [
                ".FF..",
                "..F..",
                "..F..",
                "..F..",
                "..F..",
                "..F.."],
        );
        game.spawn_tetrimino();
        console.assert(game.get_has_lost());
    }
    // Or a piece locks completely above the visible portion of the playfield
    {
        const game = game_make({ grid: { use_test_grid: true, fixed_gravity: 1 } });
        const grid = game.get_grid();
        for (let i = 1; i < grid.nrows(); i++) {
            for (let j = 0; j < grid.ncols() - 1; j++) {
                grid.get(i, j).filled = true;
            }
        }
        grid.get(0, 3).filled = true;
        game.spawn_tetrimino();
        assert_rendered(game,
            [
                ".##F.",
                "FFFF.",
                "FFFF.",
                "FFFF.",
                "FFFF.",
                "FFFF."],
        );
        console.assert(!game.get_has_lost());
        game.rotate_right();
        game.move_right();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "..#..",
                "-----",
                "..#F.",
                "FFFF.",
                "FFFF.",
                "FFFF.",
                "FFFF.",
                "FFFF."], { render_buffer: true }
        );
        game.rotate_right();
        game.tick_frame(); // Tick without moving right to reset DAS.
        game.move_right();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "..##.",
                "-----",
                "...F.",
                "FFFF.",
                "FFFF.",
                "FFFF.",
                "FFFF.",
                "FFFF."], { render_buffer: true }
        );
        // Wait for lock.
        for (let i = 0; i < 30; i++) {
            game.tick_frame();
        }
        console.assert(game.get_has_lost());
    }
    // Or a block is pushed above the 20-row buffer zone.
    {
        // TODO: not sure if this can be tested.
    }
}

function test_entry_delay() {
    {
        const game = game_make({ grid: { use_test_grid: true }, enable_spawn: true });
        for (let i = 0; i < game.get_entry_delay_frames(); i++) {
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    "....."],
            );
            game.tick_frame();
        }
        assert_rendered(game,
            [
                ".....",
                ".##..",
                ".....",
                ".....",
                ".....",
                "....."],
        );
        game.hard_drop();
        game.tick_frame();
        for (let i = 0; i < game.get_entry_delay_frames(); i++) {
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    ".FF.."],
            );
            game.tick_frame();
        }
        assert_rendered(game,
            [
                ".....",
                ".##..",
                ".....",
                ".....",
                ".....",
                ".FF.."],
        );
    }
}

function test_hold() {
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
        // Hold succeeds. Next piece spawns.
        {
            game.spawn_tetrimino();
            assert_rendered(game,
                [
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    ".....",
                    "....."],
            );
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    "....."],
            );
            game.hold();
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    ".....",
                    "....."],
            );
        }
        // Cannot swap held tetrimino back until locking.
        {
            game.hold();
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    "....."],
            );
            game.hard_drop();
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    ".FF.."],
            );
            game.spawn_tetrimino();
            assert_rendered(game,
                [
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    ".....",
                    ".FF.."],
            );
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    ".FF.."],
            );
            game.hold();
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    ".....",
                    ".FF.."],
            );
        }
    }
}

function test_scoring() {
    function apply_fill(grid, picture) {
        console.assert(grid.nrows() == picture.length);
        for (let i = 0; i < grid.nrows(); i++) {
            console.assert(grid.ncols() == picture[i].length);
            for (let j = 0; j < grid.ncols(); j++) {
                grid.get(i, j).filled = (picture[i][j] == "F");
            }
        }
    }
    function await_grid(game, picture) {
        const kMaxTicks = 100;
        let got = null;;
        let expected = null;
        for (let i = 0; i < kMaxTicks; i++) {
            got = game.render_text();
            expected = picture.join("\n");
            if (got == expected) {
                return;
            }
            game.tick_frame();
        }
        console.assert(false, "after waiting for %d ticks, did not get expected grid:\n%s\ngot grid:\n%s\n", kMaxTicks, expected, got);
    }

    function expect_score_message(game, expect_msg, expect_value) {
        const got_msg = game.get_score_message();
        console.assert(expect_msg == got_msg, "expected: '%s', got '%s'", expect_msg, got_msg);
        const got_value = game.get_score_value();
        console.assert(expect_value == got_value, "expected value %d, got %d", expect_value, got_value);
    }

    function expect_score_total(game, expect) {
        let got = game.get_score_total();
        console.assert(expect == got, "expected total score %d, got %d", expect, got);
    }
    // Test mini-T spin single.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
        apply_fill(game.get_grid(), [
            ".....",
            ".....",
            ".....",
            ".....",
            ".....",
            ".FFFF"
        ])
        game.spawn_tetrimino({ tetrimino_type: "T" });
        assert_rendered(game,
            [
                ".#...",
                "###..",
                ".....",
                ".....",
                ".....",
                ".FFFF"],
        );
        game.tick_frame();
        game.tick_frame();
        game.tick_frame();
        game.rotate_right();
        game.tick_frame();
        assert_rendered(game,
            [
                ".....",
                ".....",
                ".....",
                "#....",
                "##...",
                "#FFFF"],
        );
        // Tick until lock.
        await_grid(game,
            [
                ".....",
                ".....",
                ".....",
                ".....",
                "F....",
                "FF..."],
        );

        expect_score_message(game, "Mini T-Spin Single", 200);
    }

    // Hard drop resets mini-T spin single.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: .01 });
        apply_fill(game.get_grid(), [
            ".....",
            ".....",
            ".....",
            "F....",
            "F....",
            "F.FF."
        ])
        game.spawn_tetrimino({ tetrimino_type: "T" });
        assert_rendered(game,
            [
                ".#...",
                "###..",
                ".....",
                "F....",
                "F....",
                "F.FF."],
        );
        game.rotate_right();
        game.hard_drop();
        game.tick_frame();
        await_grid(game,
            [
                ".....",
                ".....",
                ".....",
                "FF...",
                "FFF..",
                "FFFF."],
        );

        expect_score_message(game, "", 0);
    }
    // Test back-to-back Tetris.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
        function do_tetris() {
            apply_fill(game.get_grid(), [
                ".....",
                ".....",
                ".FFFF",
                ".FFFF",
                ".FFFF",
                ".FFFF"
            ])
            game.spawn_tetrimino({ tetrimino_type: "I" });
            assert_rendered(game,
                [
                    ".....",
                    "####.",
                    ".FFFF",
                    ".FFFF",
                    ".FFFF",
                    ".FFFF"],
            );
            game.rotate_right();
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    "#....",
                    "#FFFF",
                    "#FFFF",
                    "#FFFF",
                    ".FFFF"],
            );
            game.hard_drop();
            game.tick_frame();
        }
        do_tetris();
        expect_score_message(game, "Tetris", 800);
        // Drop another piece to prevent Combo from being applied.
        {
            game.spawn_tetrimino({ tetrimino_type: "test" });
            game.hard_drop();
            game.tick_frame();
        }
        do_tetris();
        expect_score_message(game, "Back-to-Back Tetris", 800 * 1.5);
    }

    // Test soft-drop bonus.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
        expect_score_total(game, 0);
        game.spawn_tetrimino();
        expect_score_total(game, 0);
        game.soft_drop();
        game.tick_frame();
        expect_score_total(game, 1);
    }

    // Test combo bonus.
    {
        const game = game_make({ grid: { use_test_grid: true }, fixed_gravity: 1 });
        apply_fill(game.get_grid(), [
            ".....",
            ".....",
            ".....",
            ".....",
            ".FFFF",
            "FFFF."
        ]);
        // Do first Single.
        {
            game.spawn_tetrimino({ tetrimino_type: "test" });
            assert_rendered(game,
                [
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    ".FFFF",
                    "FFFF."],
            );
            game.rotate_right();
            game.move_left();
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    "#....",
                    "#....",
                    ".FFFF",
                    "FFFF."],
            );
            await_grid(game, [
                ".....",
                ".....",
                ".....",
                ".....",
                "F....",
                "FFFF."]);
            expect_score_message(game, "Single", 100);
        }
        // Do second Single.
        {
            game.spawn_tetrimino({ tetrimino_type: "test" });
            assert_rendered(game,
                [
                    ".....",
                    ".##..",
                    ".....",
                    ".....",
                    "F....",
                    "FFFF."],
            );
            game.rotate_right();
            game.move_right();
            game.tick_frame();
            game.tick_frame(); // Tick again to reset DAS.
            game.move_right();
            game.tick_frame();
            game.tick_frame(); // Tick again to reset DAS.
            game.move_right();
            game.tick_frame();
            assert_rendered(game,
                [
                    ".....",
                    ".....",
                    ".....",
                    ".....",
                    "F...#",
                    "FFFF#"],
            );
            await_grid(game, [
                ".....",
                ".....",
                ".....",
                ".....",
                ".....",
                "F...F"]);
            expect_score_message(game, "Single Combo 1", 100 + 50);
        }
    }
}
test_add_tetrimino();
test_gravity();
test_lock();
test_rotate();
test_line_clear();
test_move();
test_hard_drop();
test_soft_drop();
test_levels();
test_spawn();
test_loss();
test_entry_delay();
test_hold();
test_scoring();