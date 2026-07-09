import { db } from "./firebase.js";
import "./adminShop.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.currentUser = null;

window.showMainPage = function () {
    const user = window.currentUser;

    document.getElementById("app").innerHTML = `
        <div class="container">
            <h1>상점 프로그램</h1>
            <h2>${user.nickname}님</h2>
            <h3 id="money">${user.money}円</h3>
            <hr>

            <button id="plus100Btn">+100円</button><br><br>
            <button id="userListBtn">전체 보유금</button><br><br>
            <button id="allItemsBtn">전체 보유 물품</button><br><br>
            <button id="shopBtn">상점</button><br><br>
            <button id="inventoryBtn">인벤토리</button><br><br>
            <button id="transferBtn">양도</button><br><br>
            <button id="rouletteBtn">룰렛</button><br><br>
            
            ${
                window.currentUser.id === "admin"
                ? `<button id="adminBtn">⚙ 관리자 ⚙ </button><br><br>`
                : ""
            }
            <button id="changePwdBtn">비밀번호 변경</button><br><br>
            <button id="logoutBtn" style="background: #ff7675; color: white;">🚪 로그아웃</button>
        </div>
    `;
};
window.showUserListPage = async function () {
    await window.showUserList();
};

window.showAllItemsPage = async function () {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const inventorySnapshot = await getDocs(collection(db, "inventory"));

        const userMap = {};
        usersSnapshot.forEach(doc => {
            userMap[doc.id] = doc.data().nickname || "알 수 없는 유저";
        });
        const userInventoryData = {};

        inventorySnapshot.forEach(doc => {
            const inv = doc.data();
            if (inv.count > 0) {
                const userNickname = userMap[inv.userId] || "탈퇴한 유저";
                
                if (!userInventoryData[userNickname]) {
                    userInventoryData[userNickname] = [];
                }
                userInventoryData[userNickname].push(`${inv.name} (${inv.count}개)`);
            }
        });
        let html = `
            <div class="container">
                <h1>전체 보유 물품 목록</h1>
                <button onclick="showMainPage()">← 메인으로</button>
                <br><br>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 30%;">이름</th>
                            <th style="width: 70%;">보유 중인 물품</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        usersSnapshot.forEach(userDoc => {
            const user = userDoc.data();
            const nickname = user.nickname;
            const itemsArray = userInventoryData[nickname] || [];

            const itemsText = itemsArray.length > 0 ? itemsArray.join(", ") : "<span style='color: #ccc;'>보유 물품 없음</span>";

            html += `
                <tr class="logRow">
                    <td><b>${nickname}</b></td>
                    <td>${itemsText}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById("app").innerHTML = html;

    } catch (error) {
        console.error("전체 물품을 불러오는 중 오류 발생:", error);
        alert("데이터를 불러오지 못했습니다.");
    }
};

document.addEventListener("click", async (e) => {
    switch (e.target.id) {
        case "adminBtn":
            if (window.openAdmin) {
                await window.openAdmin();
            }
            break;

        case "plus100Btn":
            await window.addMoney(100);
            break;

        case "logoutBtn":
            await window.logout();
            break;

        case "userListBtn":
            await window.showUserListPage();
            break;

        case "allItemsBtn":
            await window.showAllItemsPage();
            break;

        case "shopBtn":
            await window.openShop();
            break;

        case "inventoryBtn":
            await window.openInventory();
            break;

        case "transferBtn":
            if (window.openTransfer)
                await window.openTransfer();
            break;

        case "rouletteBtn":
            await window.openRoulette();
            break;

        case "changePwdBtn":
            if (window.openChangePassword) {
                window.openChangePassword();
            }
            break;
    }
});