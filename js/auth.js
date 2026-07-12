import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updatePassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// [로그인 함수]
window.login = async function () {
    const idInput = document.getElementById("id");
    const passwordInput = document.getElementById("password");

    if (!idInput || !passwordInput) return;

    const id = idInput.value.trim();
    const password = passwordInput.value;

    if (!id || !password) {
        alert("아이디와 비밀번호를 입력하세요.");
        return;
    }

    try {
        await signInWithEmailAndPassword(
            auth,
            `${id}@shop.local`,
            password
        );
    } catch (e) {
        alert("로그인 실패: 아이디나 비밀번호를 확인해 주세요.");
        console.error(e);
    }
};

// [엔터 키 감지용 공통 함수]
window.handleLoginEnter = function (event) {
    if (event.key === "Enter") {
        window.login();
    }
};

// [비밀번호 변경 창 열기 함수]
window.openChangePassword = function () {
    const html = `
        <div class="container">
            <h1>비밀번호 변경</h1>
            <p style="color: #6c5ce7; font-weight: bold; margin-bottom: 20px;">
                ${window.currentUser.nickname} 님의 새 비밀번호를 입력해 주세요.
            </p>

            <input id="newPassword" type="password" placeholder="새 비밀번호 입력">
            <br>
            <input id="newPasswordConfirm" type="password" placeholder="새 비밀번호 확인" style="margin-top: 10px;">
            <br><br>

            <button onclick="executeChangePassword()">변경하기</button>
            <br>
            <button onclick="showMainPage()">← 돌아가기</button>
        </div>
    `;
    document.getElementById("app").innerHTML = html;
};

// [비밀번호 변경 실제 실행 함수]
window.executeChangePassword = async function () {
    const newPassword = document.getElementById("newPassword").value;
    const newPasswordConfirm = document.getElementById("newPasswordConfirm").value;

    if (!newPassword || !newPasswordConfirm) {
        alert("비밀번호를 입력해 주세요.");
        return;
    }

    if (newPassword !== newPasswordConfirm) {
        alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        return;
    }

    if (newPassword.length < 6) {
        alert("비밀번호는 최소 6자리 이상이어야 합니다.");
        return;
    }

    try {
        const user = auth.currentUser;
        if (user) {
            await updatePassword(user, newPassword);
            alert("비밀번호가 성공적으로 변경되었습니다! 안전을 위해 다시 로그인해 주세요.");
            await window.logout();
        } else {
            alert("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
            location.reload();
        }
    } catch (e) {
        console.error("비밀번호 변경 실패:", e);
        if (e.code === "auth/requires-recent-login") {
            alert("보안을 위해 로그아웃 후 다시 로그인한 직후에 비밀번호를 변경해 주세요.");
        } else {
            alert("비밀번호 변경에 실패했습니다. 관리자에게 문의해 주세요.");
        }
    }
};

// [인증 상태 감지 레일]
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        const app = document.getElementById("app");
        // 💡 아이디창과 비밀번호창에 onkeydown="handleLoginEnter(event)" 속성을 추가했습니다.
        app.innerHTML = `
            <div class="container">
                <h1>상점 프로그램</h1>
                <div class="loginCard">
                    <input id="id" placeholder="아이디" onkeydown="handleLoginEnter(event)">
                    <br><br>
                    <input id="password" type="password" placeholder="비밀번호" onkeydown="handleLoginEnter(event)">
                    <br><br>
                    <button onclick="login()">로그인</button>
                </div>
            </div>
        `;
        return;
    }

    const id = user.email.replace("@shop.local", "");
    const ref = doc(db, "users", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        alert("사용자 정보가 없습니다.");
        return;
    }

    window.currentUser = snap.data();
window.currentUser.id = id;

const today = new Date().toLocaleDateString("sv-SE");

if (window.currentUser.lastRouletteDate !== today) {

    window.currentUser.rouletteToday = 0;
    window.currentUser.lastRouletteDate = today;

    await updateDoc(ref, {

        rouletteToday: 0,
        lastRouletteDate: today

    });

}

    window.showMainPage();

    window.addMoney = async function (amount) {
        window.currentUser.money += amount;
        await updateDoc(
            doc(db, "users", window.currentUser.id),
            { money: window.currentUser.money }
        );
        document.getElementById("money").textContent = `${window.currentUser.money}円`;
        await window.addLog("money", `+100円 지급`);
    };

    window.logout = async function () {
        await signOut(auth);
        window.currentUser = null;
        location.reload();
    };

    window.showUserList = async function () {
        const snapshot = await getDocs(collection(db, "users"));
        let html = `
            <table>
                <tr>
                    <th>이름</th>
                    <th>보유금</th>
                </tr>
        `;

        snapshot.forEach((doc) => {
            const user = doc.data();
            html += `
                <tr>
                    <td>${user.nickname}</td>
                    <td>${user.money}円</td>
                </tr>
            `;
        });

        html += "</table>";

        document.getElementById("app").innerHTML = `
            <div class="container">
                <h1>전체 보유금</h1>
                <button onclick="showMainPage()" style="margin-bottom: 15px;">← 메인으로</button>
                ${html}
            </div>
        `;
    };
});
