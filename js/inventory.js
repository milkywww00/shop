import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.openInventory = async function () {

    const snapshot = await getDocs(collection(db, "inventory"));

    let html = `
        <h1>인벤토리</h1>

        <button onclick="showMainPage()">← 메인으로</button>

        <br><br>

        <table border="1" cellpadding="10" style="width:100%; border-collapse:collapse;">

            <tr>

                <th>아이템</th>

                <th>개수</th>

            </tr>
    `;

    let hasItem = false;

    snapshot.forEach((doc) => {

        const item = doc.data();

        if (item.userId !== window.currentUser.id) return;

        hasItem = true;

        html += `
            <tr>

                <td>${item.name}</td>

                <td>${item.count}개</td>

            </tr>
        `;

    });

    if (!hasItem) {

        html += `
            <tr>

                <td colspan="2" style="text-align:center;">

                    보유 중인 아이템이 없습니다.

                </td>

            </tr>
        `;

    }

    html += "</table>";

    document.getElementById("app").innerHTML = html;

};