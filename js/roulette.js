import { db } from "./firebase.js";

import {
    doc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.openRoulette = async function () {

    const user = window.currentUser;

    let betHTML = "";

    if (user.money > 0) {

        betHTML = `

        베팅 금액

        <br><br>

        <input
        id="rouletteBet"
        type="number"
        min="1"
        max="${user.money}"
        value="100">

        `;

    } else {

        betHTML = `

        <h3>⚠ 마이너스 룰렛</h3>

        자동 베팅

        <br><br>

        <b>${Math.abs(user.money)}円</b>

        `;

    }

    document.getElementById("app").innerHTML = `

    <h1>룰렛</h1>

    <button onclick="showMainPage()">

    ← 메인

    </button>

    <br><br>

    현재 보유금

    <h2>${user.money}円</h2>

    <hr>

    ${betHTML}

    <hr>

    오늘 남은 횟수

    <h2>${5-user.rouletteToday} / 5</h2>

    <hr>

    <div
    id="rouletteDisplay"
    style="
    height:90px;
    display:flex;
    justify-content:center;
    align-items:center;
    font-size:64px;
    font-weight:bold;
    color:black;
    ">

    ?

    </div>

    <br>

    <button
    id="spinButton"
    onclick="spinRoulette()">

    돌리기

    </button>

    `;

}

window.spinRoulette = async function(){

    const button =
        document.getElementById("spinButton");

    button.disabled = true;

    if(window.currentUser.rouletteToday>=5){

        alert("오늘은 이미 5회 사용했습니다.");

        button.disabled=false;

        return;

    }

    const oldMoney =
        Number(window.currentUser.money);

    let bet=0;

    if(oldMoney>0){

        bet=Number(
            document.getElementById("rouletteBet").value
        );

        if(isNaN(bet)||bet<=0){

            alert("베팅 금액을 입력하세요.");

            button.disabled=false;

            return;

        }

        if(bet>oldMoney){

            alert("보유금보다 많이 베팅할 수 없습니다.");

            button.disabled=false;

            return;

        }

    }

    const result =
        getRouletteResult();

    await playRouletteAnimation(result);

    const isMinus =
        oldMoney<=0;

    let newMoney;

    if(isMinus){

        newMoney=
            oldMoney*result;

    }else{

        newMoney = oldMoney + (bet * result);

    }

    window.currentUser.money=
        newMoney;

    window.currentUser.rouletteToday++;

    await runTransaction(db, async(transaction)=>{

    const ref = doc(
        db,
        "users",
        window.currentUser.id
    );

    transaction.update(ref,{

        money:newMoney,

        rouletteToday:
        window.currentUser.rouletteToday

    });

});

    await window.addLog(

        "roulette",

        isMinus

        ?

        `마이너스 룰렛 | ${oldMoney}円 → ${newMoney}円 | ${result>0?"+":""}${result}`

        :

        `일반 룰렛 | ${oldMoney}円 → ${newMoney}円 | 베팅 ${bet}円 | ${result>0?"+":""}${result}`

    );

    showRouletteResult(

        oldMoney,
        newMoney,
        result,
        isMinus

    );

}

async function playRouletteAnimation(finalValue){

    const display =
        document.getElementById("rouletteDisplay");

    const values=[
        -4,-3,-2,-1,0,1,2,3,4
    ];

    let delay=40;

    for(let i=0;i<40;i++){

        const value=
            values[
                Math.floor(
                    Math.random()*values.length
                )
            ];

        drawRouletteValue(value);

        await new Promise(resolve=>
            setTimeout(resolve,delay)
        );

        delay+=6;

    }

    drawRouletteValue(finalValue);

}

function drawRouletteValue(value){

    const display=
        document.getElementById("rouletteDisplay");

    display.textContent=
        value>0
        ? "+"+value
        : value;

    if(value>=2){

        display.style.color="limegreen";

    }else if(value<=-2){

        display.style.color="crimson";

    }else{

        display.style.color="black";

    }

}

function showRouletteResult(

    oldMoney,
    newMoney,
    result,
    isMinus

){

    let title="룰렛 결과";

    if(result===4){

        title="🎉 대성공! 🎉";

    }

    if(result===-4){

        title="💥 대실패! 💥";

    }

    document.getElementById("app").innerHTML=`

    <h1>${title}</h1>

    <hr>

    <div
    style="
    font-size:80px;
    font-weight:bold;
    color:${
        result>=2
        ?"limegreen"
        :result<=-2
        ?"crimson"
        :"black"
    };
    ">

    ${result>0?"+":""}${result}

    </div>

    <br>

    <h2>

    ${isMinus?"마이너스 룰렛":"일반 룰렛"}

    </h2>

    <br>

    <table
    style="
    margin:auto;
    font-size:24px;
    ">

    <tr>

    <td>

    이전 보유금

    </td>

    <td>

    ${oldMoney}円

    </td>

    </tr>

    <tr>

    <td>

    결과

    </td>

    <td>

    ↓

    </td>

    </tr>

    <tr>

    <td>

    현재 보유금

    </td>

    <td>

    ${newMoney}円

    </td>

    </tr>

    </table>

    <br><br>

    <button
    onclick="openRoulette()">

    다시 돌리기

    </button>

    &nbsp;

    <button
    onclick="showMainPage()">

    메인으로

    </button>

    `;

    if(result===4){

        document.body.animate(

            [

                {transform:"scale(1)"},

                {transform:"scale(1.03)"},

                {transform:"scale(1)"}

            ],

            {

                duration:500

            }

        );

    }

    if(result===-4){

        document.body.animate(

            [

                {transform:"translateX(-10px)"},

                {transform:"translateX(10px)"},

                {transform:"translateX(-10px)"},

                {transform:"translateX(10px)"},

                {transform:"translateX(0px)"}

            ],

            {

                duration:500

            }

        );

    }

}

function getRouletteResult(){

    const random = Math.random() * 100;

    // 확률
    // -4 : 2%
    // -3 : 5%
    // -2 : 10%
    // -1 : 25%
    //  0 : 8%
    // +1 : 25%
    // +2 : 15%
    // +3 : 7%
    // +4 : 3%

    if(random < 2) return -4;

    if(random < 7) return -3;

    if(random < 17) return -2;

    if(random < 42) return -1;

    if(random < 50) return 0;

    if(random < 75) return 1;

    if(random < 90) return 2;

    if(random < 97) return 3;

    return 4;

}