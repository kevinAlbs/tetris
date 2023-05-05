# Refactors to consider
- Rename variables tracking recent state transitions to `did_*`
    - Rename `fill_occurred` to `did_lock`
    - Rename `applied_gravity` to `did_apply_gravity`
- Hide access to invalidated state.
    - E.g. if `score_did_rotate_last` is false, `score_last_kick_applied` may be stale. Consider updating both:
        ```js
            function make_scorer () {
                const obj = {};
                let did_rotate_last = false;
                let last_kick_applied = null;
                obj.clear_rotate = function () {
                    did_rotate_last = false;
                }
                obj.did_rotate = function(last_kick) {
                    did_rotate_last = true;
                    last_kick_applied = last_kick;
                }
                obj.did_lock = function () {
                    // Tetrimino locked. Check for scoring.
                }
            }
        ```
--
I had this logic:
```javascript
did_move ||= try_move("left");
```

The intent was to set `did_move` to true if `try_move` returned true.
I did not expect that `try_move` is not called if `did_move` is already true.
A slow framerate for testing helped to diagnose this issue. Pressing both left and right arrows resulted in the tetrimino moving left. I expected the moves to cancel out.
A test was added to check the behavior:
```javascript
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
```
The test failed with this message: ![debug-with-test.png].
A fix was applied in a0667c3c8f46b88dd9f8bc914c15d42413cce71d.
--
# References
https://harddrop.com/wiki/Tetris_at_tetris.com lists scoring rules for tetris.com
https://www.reddit.com/r/Tetris/comments/e1ov09/how_does_level_25_and_up_work_for_tetriscom/ lists possible lock rates at level 20 or higher.
https://harddrop.com/wiki/Tetris_Worlds lists gravity values for levels in Tetris Worlds

# Notable not done
- Gravity and lock rate is computed with floats. It may be preferable to use integers to avoid floating point error.