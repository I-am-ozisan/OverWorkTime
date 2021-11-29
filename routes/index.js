const { resolve } = require("path");

const router = require("express").Router();

/**
 * 初期表示
 */
router.get("/init", async(req, res) => {

    /**
     * メイン処理
     */
    let userId = await setcookieInfo(req.cookies.key);
    let resData = await getWorkTime(userId);
    res.cookie("key", userId);
    res.render("index.ejs", setResData(resData, userId));
});

/**
 * 更新ボタン押下時
 */
router.post("/update", async(req, res) => {

    /**
     * メイン処理
     */
    let userId = await setcookieInfo(req.cookies.key);
    await registWorkTimeInfo(userId, req.body.arrayReqData);
    res.send();
});

/**
 * 出力ボタン押下時
 */
router.post('/file', async(req, res) => {
    await createCsv(createCsvData(req.body, req.cookies.key));
    res.send();


})

/**
 * undefined判定式
 */
function isUndefinedChecked(data) {
    if (data === 'undefined') {
        return false;
    } else if (data === undefined) {
        return false;
    } else {
        return true;
    }
}

/**
 * 指定月の日数を取得
 * @param {*} year 年
 * @param {*} month 月
 * @returns 　指定した月の末日
 */
function getLastDate() {
    return new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
}

/**
 * 残業時間のデータを取得
 * @param {*} userId ユーザー情報
 */
function getWorkTime(userId) {
    return new Promise(async(resolve, reject) => {

        let ConnectInfo = require("./config.js");
        let query =
            `SELECT 
                    to_char(M1.calendar_date,'YYYY/MM/DD') AS calendar_date
                    ,M1.week_of_date
                    ,M1.holiday_flg
                    ,COALESCE(T1.estimate_start_time,'00:00') AS estimate_start_time
                    ,COALESCE(T1.estimate_end_time,'00:00') AS estimate_end_time
                    ,COALESCE(T1.rest_time,'00:00') AS rest_time
                    ,COALESCE(T1.expreience_end_time,'00:00') AS expreience_end_time
                    ,COALESCE(T1.over_time,'00:00') AS over_time
                FROM 
                    m_calendar M1
                LEFT JOIN 
                    T_WORKTIME T1
                    ON M1.calendar_date = T1.calendar_date
                    AND T1.USER_ID = '` + userId + `' 
                    AND date_trunc('month', T1.calendar_date) = DATE '` + getTodayInfo() + "'" + `
                WHERE 
                    date_trunc('month', M1.calendar_date) = DATE '` + getTodayInfo() + "'" + `
                ORDER BY T1.calendar_date ASC`;
        //SQL実行
        let resultWorkTime = await ConnectInfo(query);
        let outputObj = {
            workTime: resultWorkTime,
        }
        resolve(outputObj);
    })
}

/**
 * レスポンスデータの作成
 * @param {*} data SQLの取得結果
 * @returns レスポンスデータ
 */
function setResData(data, userId) {

    let resData = {
        calendar: getLastDate(),
        workTime: data.workTime,
        csvfilepath: "/tmp/" +
            new Date().getFullYear() +
            (new Date().getMonth() + 1) +
            "_" + userId + ".csv"
    }

    return resData;
}

/**
 * 当月の月初を返却。
 * @returns 当月の月初
 */
function getTodayInfo() {
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    return year + "/" + month + "/" + "01"
}

/**
 * クッキー作成。
 * @param {*} cookie 既存のクッキー
 */
async function setcookieInfo(cookie) {
    if (!isUndefinedChecked(cookie)) {
        let checkFlg = true;
        let userId;
        //ユーザーIDが被らないまでチェックする
        while (checkFlg) {
            //乱数を生成。
            let ramdomUserId = Math.floor(Math.random() * 10000000);
            //ユーザーID既存チェック
            let resultCheckData = await isCheckUseriD(ramdomUserId)
            checkFlg = resultCheckData.checkFlg;
            userId = resultCheckData.userId;
        }
        return userId;
    } else {
        return cookie;
    }
}

/**
 * 生成されたクッキーの既存チェック
 * @param {*} userId ユーザーID
 * @returns 
 */
function isCheckUseriD(userId) {
    return new Promise(async(resolve, reject) => {
        let ConnectInfo = require("./config.js");
        let query = "SELECT count(*) FROM T_WORKTIME WHERE USER_ID = '" + userId + "'";

        //SQL実行
        let resultCount = await ConnectInfo(query);
        //UserIDがDBに既存しない場合。
        if (resultCount[0].count === '0') {
            let resultObj = {
                userId: userId,
                checkFlg: false
            }
            resolve(resultObj);
        } else {
            //UserIDがDBに既存する場合。
            let resultObj = {
                userId: userId,
                checkFlg: true
            }
            resolve(resultObj);
        }
    });
}

/**
 * 登録・更新を実施
 * @param {*} userId クッキーのユーザーID
 * @param {*} workTimeInfo 画面の時間の表
 */
async function registWorkTimeInfo(userId, workTimeInfoArray) {

    //一件ずつ登録・更新を実施。
    for (let workTimeData of workTimeInfoArray) {
        let count = await getWorkTimeArrayDbCount(userId, workTimeData.calendarDate);
        if (count !== '0') {
            await update(workTimeData, userId);
        } else {
            await insert(workTimeData, userId);
        }
    }
}
/**
 * 登録する内容のDB既存チェック
 * @param {*} userId ユーザーID
 * @param {*} calendarDate 日付
 * @returns データ件数
 */
function getWorkTimeArrayDbCount(userId, calendarDate) {
    return new Promise(async(resolve, reject) => {
        let ConnectInfo = require("./config.js");
        let query =
            `SELECT count(*) 
             FROM T_WORKTIME 
             WHERE USER_ID = '` + userId + `'` +
            `AND calendar_date = '` + calendarDate + `'`;
        //SQLを実施
        let resultCount = await ConnectInfo(query.replace(/\r?\n/g, ""));
        resolve(resultCount[0].count);
    });

}

/**
 * Update実施
 * @param {*} element 画面の1行の情報
 * @param {*} userId ユーザID 
 */
function update(element, userId) {
    return new Promise(async(resolve, reject) => {
        let ConnectInfo = require("./config.js");
        let query =
            `UPDATE T_WORKTIME 
             SET estimate_start_time = '` + element.estimateStartTime + `'` +
            `,estimate_end_time = '` + element.estimateEndTime + `'` +
            `,rest_time = '` + element.restTime + `'` +
            `,expreience_end_time = '` + element.expreienceEndTime + `'` +
            `,over_time = '` + element.overTime + `'` +
            `,version = version +1 ` +
            `WHERE user_id = '` + userId + `'
             AND calendar_date = '` + element.calendarDate + `'
                        `;

        //update実施
        await ConnectInfo(query.replace(/\r?\n/g, ""))
        resolve();
    });
}

/**
 * Insertを実施
 * @param {*} element 画面の1行の情報
 * @param {*} userId ユーザID
 */
function insert(element, userId) {
    return new Promise(async(resolve, reject) => {
        let ConnectInfo = require("./config.js");
        let query =
            `INSERT INTO
         t_worktime
            (
                user_id
                , calendar_date
                , estimate_start_time
                , estimate_end_time
                , rest_time
                , expreience_end_time
                , over_time
                , version
                , logical_delete_flg
            )
         VALUES
            (` +
            `'` + userId + `'` +
            `,` + `'` + element.calendarDate + `'` +
            `,` + `'` + element.estimateStartTime + `'` +
            `,` + `'` + element.estimateEndTime + `'` +
            `,` + `'` + element.restTime + `'` +
            `,` + `'` + element.expreienceEndTime + `'` +
            `,` + `'` + element.overTime + `'` +
            `,` + `'` + `0` + `'` +
            `,` + `'` + `0` + `'` + `)`

        //insert実施
        await ConnectInfo(query.replace(/\r?\n/g, ""));
        resolve();
    });
}

/**
 * CSVデータを作成
 * @param {*} inputCscData CSV作成のためのデータ
 * @returns CSVデータ
 */
function createCsvData(inputCsvData, userId) {
    let csvArrayData = [];
    inputCsvData.arrayReqData.forEach((element, index) => {
        let csvObj = {
            "calendarDate": element.calendarDate,
            "estimateStartTime": element.estimateStartTime,
            "estimateEndTime": element.estimateEndTime,
            "restTime": element.restTime,
            "expreienceEndTime": element.expreienceEndTime,
            "overTime": element.overTime

        }
        csvArrayData[index] = csvObj;
    });
    //最後の一行に追加
    csvArrayData[csvArrayData.length] = inputCsvData.sumOverTimeInfo;
    //CSV出力データ作成
    let outputCsvData = {
        csvArrayData: csvArrayData,
        fileName: new Date().getFullYear() + "" + (new Date().getMonth() + 1) + "_" + userId + ".csv"
    }
    return outputCsvData;
}

/**
 * CSVファイル作成
 * @param {*} csvData 
 * @returns 
 */
async function createCsv(csvData) {
    return new Promise(async(resolve, reject) => {
        const { createObjectCsvWriter } = require('csv-writer');
        const path = require('path');
        //相対パスを取得。
        const csvfilepath = path.resolve(__dirname, '..') + '/tmp/' + csvData.fileName;
        //基礎情報作成。
        const csvWriter = createObjectCsvWriter({
            path: csvfilepath,
            header: [
                { id: 'calendarDate', title: '日付' },
                { id: 'estimateStartTime', title: '予定開始時刻' },
                { id: 'estimateEndTime', title: '予定終了時刻' },
                { id: 'restTime', title: '残業後休憩時間' },
                { id: 'expreienceEndTime', title: '実績終了時刻' },
                { id: 'overTime', title: '残業時間' }
            ],
            encoding: 'utf8',
            append: false,
        });
        //CSV出力
        await csvWriter.writeRecords(csvData.csvArrayData);
        resolve();
    });
}
module.exports = router;