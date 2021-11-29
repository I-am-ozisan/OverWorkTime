let express = require("express");
let app = express();
let cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;
//レンダーの指定
app.set("view engine", "ejs");
//静的ファイルの読み込み
app.use('/public', express.static(__dirname + '/public'));
app.use('/tmp', express.static(__dirname + '/tmp'));
//クッキーパーサーの設定。
app.use(cookieParser());
//ボーディーパーサーの設定。
app.use(express.urlencoded(true));
app.use(express.json());
//ルーティングの実施
app.use("/", require("./routes/index.js"));
app.listen(port);