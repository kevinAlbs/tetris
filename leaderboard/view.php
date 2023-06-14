<html>

<head>
    <title>Tetris</title>
    <meta name="viewport" content="width=462, maximum-scale=1, user-scalable=no">
    <link rel="icon" type="image/png" href="../img/favicon.png">
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-HDRY5R79EL"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());

        gtag('config', 'G-HDRY5R79EL');
    </script>
    <style type="text/css">
        body.dark {
            background: #333;
        }

        body.dark h1 {
            color: #eee;
        }

        body.dark td, body.dark th {
            color: #eee;
        }

        th {
            text-align: left;
        }

        body.dark a {
            color: #FFF;
        }

        body.dark .popup a {
            color: initial;
        }

        * {
            padding: 0px;
            margin: 0px;
            font-family: "Courier New"
        }

        h1 {
            font-size: 20px;
        }

        #main {
            width: 454px;
            margin: 4px auto;
        }

        #main table {
            width: 100%;
            margin-bottom: 10px;
            table-layout: fixed;
        }

        .entry {
            position: relative;
            background: #EEE;
        }

        body.dark .entry {
            background: #222;
        }

        #main table tr td:first-child {
            width: 4em;
        }

        .entry .place {
            position: absolute;
            top: 1px;
            right: 1px;
            display: inline-block;
            color: #111;
            font-weight: bold;
            background: #F55;
            padding: 3px;
        }

    </style>
</head>

<body>
    <div id="main">

    <h1>Tetris Leaderboard - Top 100</h1>
<?php

// Create/open the database
$db = new SQLite3('tetris.db');

// Create table if not exists
$query = "CREATE TABLE IF NOT EXISTS highscores (
    name TEXT,
    score INTEGER,
    level INTEGER,
    lines INTEGER,
    date INTEGER
)";
$db->exec($query);

// Check if database already has entry. 
$stmt = $db->prepare("SELECT * FROM highscores ORDER BY score DESC LIMIT 100");
$res = $stmt->execute();
$place = 1;
while ($row = $res->fetchArray()) {
    echo "<div class='entry'>";
    echo "<div class='place'>" . $place . "</div>";
    echo "<table>";
    printf ("<tr><td>Name</td><td>%s</td></tr>", htmlspecialchars($row["name"]));
    printf ("<tr><td>Score</td><td>%s</td></tr>", htmlspecialchars($row["score"]));
    printf ("<tr><td>Level</td><td>%s</td></tr>", htmlspecialchars($row["level"]));
    printf ("<tr><td>Lines</td><td>%s</td></tr>", htmlspecialchars($row["lines"]));
    printf ("<tr><td>Date</td><td class='date' data-dateunix='%d'></td></tr>", htmlspecialchars($row["date"]));
    echo "</table>";
    echo "</div>";
    $place++;
}

// Close the database connection
$db->close();
?>
    </div>

    <script>
        if (window.localStorage.getItem("dark_mode") == "on") {
            document.body.classList.add("dark");
        }
        document.querySelectorAll(".date").forEach((date_el) => {
            const date_unix = parseInt(date_el.getAttribute("data-dateunix"));
            const date_date = new Date(date_unix);
            date_el.innerHTML = date_date.toLocaleString();
        });
    </script>
</body>
</html>