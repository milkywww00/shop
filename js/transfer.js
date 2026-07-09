import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.openTransfer = async function () {

    const snapshot = await getDocs(collection(db, "users"));

    let html = `
    <style>
        .transfer-card {
            max-width: 400px;
            margin: 30px auto;
            padding: 30px 24px;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
            font-family: 'Pretendard', -apple-system, sans-serif;
            box-sizing: border-box;
        }
        .transfer-title {
            font-size: 24px;
            color: #5f27cd;
            font-weight: 700;
            text-align: center;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .btn-back {
            width: 100%;
            padding: 11px;
            background: #f1f2f6;
            color: #57606f;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s;
            margin-bottom: 24px;
        }
        .btn-back:hover {
            background: #e4e7eb;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #2f3542;
            margin-bottom: 8px;
        }
        .form-select, .form-input {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #ced6e0;
            border-radius: 10px;
            font-size: 15px;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.2s, box-shadow 0.2s;
            background-color: #fff;
        }
        .form-select:focus, .form-input:focus {
            border-color: #5f27cd;
            box-shadow: 0 0 0 3px rgba(95, 39, 205, 0.1);
        }
        
        .type-selector {
            display: flex;
            background: #f1f2f6;
            padding: 4px;
            border-radius: 10px;
            margin-bottom: 24px;
        }
        .type-option {
            flex: 1;
            text-align: center;
        }
        .type-option input[type="radio"] {
            display: none; 
        }
        .type-text {
            display: block;
            padding: 10px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            color: #57606f;
            cursor: pointer;
            transition: all 0.2s;
        }
        .type-option input[type="radio"]:checked + .type-text {
            background: #ffffff;
            color: #5f27cd;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .btn-submit {
            width: 100%;
            padding: 14px;
            background: #5f27cd;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(95, 39, 205, 0.2);
            transition: background 0.2s, transform 0.1s;
            margin-top: 10px;
        }
        .btn-submit:hover {
            background: #4b14b5;
        }
        .btn-submit:active {
            transform: scale(0.98);
        }
    </style>

    <div class="transfer-card">
        <h1 class="transfer-title">보유금 / 아이템 양도</h1>

        <button class="btn-back" onclick="showMainPage()">← 메인으로</button>

        <div class="form-group">
            <label class="form-label">받는 사람</label>
            <select id="targetUser" class="form-select">
    `;

    snapshot.forEach((doc)=>{

        if(doc.id===window.currentUser.id) return;

        const user=doc.data();

        html+=`
            <option value="${doc.id}">
                ${user.nickname}
            </option>
        `;

    });

    html+=`
            </select>
        </div>

        <div class="type-selector">
            <label class="type-option">
                <input type="radio" name="transferType" value="money" checked>
                <span class="type-text">보유금</span>
            </label>
            <label class="type-option">
                <input type="radio" name="transferType" value="item">
                <span class="type-text">아이템</span>
            </label>
        </div>

        <div id="transferArea" class="form-group">
            <label class="form-label">금액</label>
            <input id="moneyAmount" class="form-input" type="number" value="100">
        </div>

        <button class="btn-submit" onclick="executeTransfer()">양도하기</button>
    </div>
    `;

    document.getElementById("app").innerHTML=html;

}

document.addEventListener("change", async (e) => {

    if (e.target.name !== "transferType") return;

    const area = document.getElementById("transferArea");

    if (!area) return;

    if (e.target.value === "money") {

        area.innerHTML = `
        <label class="form-label">금액</label>
        <input
        id="moneyAmount"
        class="form-input"
        type="number"
        min="1"
        value="100">
        `;

        return;

    }

    const q = query(
        collection(db, "inventory"),
        where("userId", "==", window.currentUser.id)
    );

    const snapshot = await getDocs(q);

    let html = `
    <label class="form-label">아이템</label>
    <select id="itemSelect" class="form-select">
    `;

    snapshot.forEach((doc)=>{

        const item = doc.data();

        html += `
        <option value="${doc.id}">
            ${item.name} (${item.count}개)
        </option>
        `;

    });

    html += `
    </select>
    <br><br>
    <label class="form-label">개수</label>
    <input
    id="itemCount"
    class="form-input"
    type="number"
    min="1"
    value="1">
    `;

    area.innerHTML = html;

});

window.executeTransfer = async function () {

    const targetId =
    document.getElementById("targetUser").value;

const type =
    document.querySelector(
        'input[name="transferType"]:checked'
    ).value;

    if (type === "item") {

    const myDocId = document.getElementById("itemSelect").value;

    const count = Number(document.getElementById("itemCount").value);

    const myRef = doc(db, "inventory", myDocId);

    const mySnap = await getDoc(myRef);

    const myItem = mySnap.data();

    if (count <= 0) {

        alert("수량을 입력하세요.");
        return;

    }

    if (count > myItem.count) {

        alert("보유 수량보다 많이 보낼 수 없습니다.");

        return;

    }

    const itemId = myItem.itemId;

    const targetInventoryId =
        `${targetId}_${itemId}`;

    const targetInventoryRef =
        doc(db, "inventory", targetInventoryId);

    const targetInventorySnap =
        await getDoc(targetInventoryRef);

    if (targetInventorySnap.exists()) {

        await updateDoc(targetInventoryRef,{

            count:
                targetInventorySnap.data().count+count

        });

    } else {

        await setDoc(targetInventoryRef,{

            userId:targetId,

            itemId:itemId,

            name:myItem.name,

            count:count

        });

    }

    if(myItem.count===count){

        await deleteDoc(myRef);

    }else{

        await updateDoc(myRef,{

            count:myItem.count-count

        });

    }

    await window.addLog(

    "itemTransfer",

    `${myItem.name} ${count}개 → ${targetId}`

);

    alert("아이템을 양도했습니다.");

    await window.openTransfer();

    return;

}


    const amount =
        Number(document.getElementById("moneyAmount").value);

    if (amount <= 0) {

        alert("1円 이상 입력하세요.");
        return;

    }

    if (window.currentUser.money < amount) {

        alert("현재 보유금보다 많이 보낼 수 없습니다.");
        return;

    }

    const targetRef = doc(db, "users", targetId);

    const targetSnap = await getDoc(targetRef);

    const target = targetSnap.data();

    await updateDoc(
        doc(db, "users", window.currentUser.id),
        {
            money: window.currentUser.money - amount
        }
    );

    await updateDoc(
        targetRef,
        {
            money: target.money + amount
        }
    );

    window.currentUser.money -= amount;

await window.addLog(
    "transfer",

    `${amount}円 → ${targetId}`
);

alert("양도가 완료되었습니다.");

await window.showMainPage();

};