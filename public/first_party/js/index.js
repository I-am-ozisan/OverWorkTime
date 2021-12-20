const updateUrl = "/update";
const fileUrl = "/file";

/**
 * 初期表示時
 */
$(function() {
    //総残業時間の画面出力。
    $(".sum-overwork-time-value").text(getSumOverTime());
});

/**
 * 時刻が入力された場合のイベント
 */
$("input").on("change", function() {
    let windowEstimateEndTime = $(this).parents("tr").children("td").children(".estimateEndTime").val();
    let windowExpreienceEndTime = $(this).parents("tr").children("td").children(".expreienceEndTime").val();
    let windowRestTime = $(this).parents("tr").children("td").children(".restTime").val();
    if (windowEstimateEndTime !== "" && windowExpreienceEndTime !== "" && windowRestTime !== "") {
        //予定終了時刻
        let estimateEndTime = getClacTime(formatterHalfSize(windowEstimateEndTime));
        //実績終了時刻
        let expreienceEndTime = getClacTime(formatterHalfSize(windowExpreienceEndTime));
        //定時後休憩時刻
        let restTime = getClacTime(formatterHalfSize(windowRestTime));
        //残業後休憩時刻を組み込んだ残業時刻を抽出。
        let tmpWorkTime = calcTime(expreienceEndTime, estimateEndTime);
        let workTime = calcTime(getClacTime(tmpWorkTime), restTime);
        //残業時間の画面出力。
        $(this).parents("tr").children("td").children(".overTime").val(workTime.substr(0, 5));
        //総残業時間の画面出力。
        $(".sum-overwork-time-value").text(getSumOverTime());
        $(this).parents("tr").children("td").children(".estimateEndTime").val(formatterHalfSize(windowEstimateEndTime));
        $(this).parents("tr").children("td").children(".expreienceEndTime").val(formatterHalfSize(windowExpreienceEndTime));
        $(this).parents("tr").children("td").children(".restTime").val(formatterHalfSize(windowRestTime));

        /**
         * 時間の引き算を実施
         * @param {*} oneParamTime 第1パラメータ
         * @param {*} secondParamTime 第2パラメータ
         * @returns 
         */
        function calcTime(oneParamTime, secondParamTime) {
            let resultHour = 0;
            let resultMin = 0;
            let resultTime = 0;
            if (oneParamTime.min < secondParamTime.min) {
                oneParamTime.min = oneParamTime.min + 60;
                oneParamTime.hour = oneParamTime.hour - 1;
            }
            //実績時刻から予定時刻を引いて残業時間を算出。
            resultHour = oneParamTime.hour - secondParamTime.hour;
            resultMin = oneParamTime.min - secondParamTime.min;
            //hh:mmにフォーマット
            if (resultMin === 0) {
                resultTime = resultHour + ":" + resultMin + "0";
            } else if (String(resultMin).length == 1) {

                resultTime = resultHour + ":" + "0" + resultMin;
            } else {
                resultTime = resultHour + ":" + resultMin;
            }
            return resultTime;
        }
    }
});

/**
 * 更新ボタン押下時のイベント
 */
$(".btn-update").on("click", function() {
    //メッセージの非表示
    invisibleMessage();
    setTimeout(() => {
        //リクエストデータの作成。
        let reqData = getReqDate();
        //リクエストの実施。
        reqPostAjax(reqData, updateUrl);
    }, 500);

});

/**
 * 出力ボタン押下時
 */
$(".btn-file").on("click", function() {
    //メッセージの非表示
    reqPostFileDl(getReqDate(), fileUrl);
});

/**
 * リクエストデータの作成
 * @returns リクエストデータ
 */
function getReqDate() {
    let arrayReqData = new Array();
    $("tr").each(function(index) {
        let reqData = {
            calendarDate: $(this).children("th").text().replace(/\r?\n/g, "").trim().substr(0, 10),
            estimateStartTime: $(this).children("td").children(".estimateStartTime").val(),
            estimateEndTime: $(this).children("td").children(".estimateEndTime").val(),
            restTime: $(this).children("td").children(".restTime").val(),
            expreienceEndTime: $(this).children("td").children(".expreienceEndTime").val(),
            overTime: $(this).children("td").children(".overTime").val(),
        }
        arrayReqData[index - 1] = reqData
    });
    let reqDataobj = {
        arrayReqData: arrayReqData,
        sumOverTimeInfo: {
            calendarDate: "総残業時間",
            estimateStartTime: $(".sum-overwork-time-value").text()
        }
    }
    return reqDataobj;
}
/**
 * リクエスト送信(post)
 */
function reqPostAjax(reqData, url) {
    $.ajax({
        async: true,
        url: url,
        type: "post",
        data: reqData,
        dataType: "text",
        timeout: 10000,
        success: visibleInfoMessage()
    }).fail((XMLHttpRequest, textStatus, errorThrown) => {
        visibleErrorMessage();
    })
}

/**
 * リクエスト送信(POST/DL)
 */
function reqPostFileDl(reqData, url) {
    $.ajax({
        async: true,
        url: url,
        type: "POST",
        data: reqData,
        dataType: "text",
        timeout: 10000,
        success: function(data) {
            location.href = $(".download").attr("href");
        }
    }).fail((XMLHttpRequest, textStatus, errorThrown) => {
        visibleErrorMessage();
    })
}
/**
 * 更新完了メッセージを表示
 */
function visibleInfoMessage() {
    $(".alert-success").css({
        "margin-bottom": "0",
        "display": "block"
    });
    $("thead").css({
        "top": "12%"
    });
}

/**
 * エラーメッセージを表示
 */
function visibleErrorMessage() {
    $(".alert-danger").css({
        "margin-bottom": "0",
        "display": "block"
    });
    $("thead").css({
        "top": "12%"
    });
}

/**
 * エラーメッセージを非表示
 */
function invisibleMessage() {

    $(".alert-danger").css({
        "display": "none"
    });
    $(".alert-success").css({
        "display": "none"
    });
}

/**
 * mm:ssを:を取り除く。
 * @param {*} time mm:ssの時刻 
 * @returns 時と分
 */
function getClacTime(time) {
    let formatterTime = {
        hour: parseInt(time.substr(0, time.length - 3)),
        min: parseInt(time.substr(-2))
    }
    return formatterTime;
}

/**
 * 残業時間の足し算を実施。
 * @returns 
 */
function getSumOverTime() {
    let sum = "00:00";
    $(".result-row").each(function(index, element) {
        let overTime = getClacTime($(element).children("td").children(".overTime").val());
        sum = calcSumTime(overTime, getClacTime(sum));
    });
    return sum;
}

/**
 * 時間の足し算を実施
 * @param {*} oneParamTime 第1パラメータ
 * @param {*} secondParamTime 第2パラメータ
 * @returns 
 */
function calcSumTime(oneParamTime, secondParamTime) {
    let resultHour = 0;
    let resultMin = 0;
    let resultTime = 0;
    if (oneParamTime.min + secondParamTime.min >= 60) {
        resultHour = (oneParamTime.hour + secondParamTime.hour) + 1;
        resultMin = (oneParamTime.min + secondParamTime.min) - 60;
    } else {
        resultHour = oneParamTime.hour + secondParamTime.hour;
        resultMin = oneParamTime.min + secondParamTime.min;
    }

    //hh:mmにフォーマット
    if (resultMin === 0) {
        resultTime = resultHour + ":" + resultMin + "0";
    } else if (String(resultMin).length == 1) {
        resultTime = resultHour + ":" + "0" + resultMin;
    } else {
        resultTime = resultHour + ":" + resultMin;
    }

    return resultTime;
}

function formatterHalfSize(time) {
    return time.replace(/[：０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
}