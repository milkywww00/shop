import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.addLog = async function (type, detail) {
    if (!window.currentUser) return;
    try {
        await addDoc(collection(db, "logs"), {
    userId: window.currentUser.id,
    nickname: window.currentUser.nickname,
    type,
    message: detail,
    time: serverTimestamp()
});
    } catch (e) {
        console.error("로그 기록 실패:", e);
    }
};

window.openUserLog = async function (userId) {
    document.getElementById("app").innerHTML = `
        <div class="container">
            <h1>📜 유저 활동 로그</h1>
            <p>로그 데이터를 불러오는 중입니다...</p>
        </div>
    `;

    try {
        const q = query(
            collection(db, "logs"),
            where("userId", "==", userId),
            orderBy("time", "desc")
        );
        const snapshot = await getDocs(q);
        let html = `
            <div class="container">
                <h1>📜 유저 활동 로그</h1>
                <p style="color: #6c5ce7; font-weight: bold; margin-bottom: 20px;">
                    ID: ${userId} 님의 최근 활동 내역
                </p>
                
                <button onclick="openUserManager()" style="background: #eeecef; color: #616161; margin-bottom: 20px;">
                    ← 회원 관리로 돌아가기
                </button>

                <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e8e8ed; border-radius: 14px; background: #fafafa;">
                    <table style="margin-top: 0; border: none;">
                        <thead>
                            <tr>
                                <th style="width: 30%">일시</th>
                                <th style="width: 25%">분류</th>
                                <th style="width: 45%">상세 내역</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (snapshot.empty) {
            html += `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 30px; color: #999;">
                        기록된 활동 로그가 없습니다.
                    </td>
                </tr>
            `;
        } else {
            snapshot.forEach((doc) => {
                const log = doc.data();
                
                let displayTime = "-";
                if (log.time) {
    const date = log.time.toDate();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    displayTime = `${month}-${day} ${hours}:${minutes}`;
                }
                let typeBadge = log.type;
                if (log.type === "shop") typeBadge = "<span style='color: #fd79a8; font-weight:bold;'>상점구매</span>";
                if (log.type === "roulette") typeBadge = "<span style='color: #e17055; font-weight:bold;'>룰렛</span>";
                if (log.type === "transfer") typeBadge = "<span style='color: #6c5ce7; font-weight:bold;'>금전양도</span>";
                if (log.type === "itemTransfer") typeBadge = "<span style='color: #00b894; font-weight:bold;'>템양도</span>";

                html += `
                    <tr class="logRow">
                        <td style="font-size: 12px; color: #888;">${displayTime}</td>
                        <td>${typeBadge}</td>
                        <td style="text-align: left; font-size: 13px;">${log.message}</td>
                    </tr>
                `;
            });
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById("app").innerHTML = html;

    } catch (e) {
        console.error("로그 로딩 에러:", e);
        alert("로그를 불러오는데 실패했습니다. (Firestore 색인 인덱스가 설정 중이거나 권한 문제일 수 있습니다.)");
        if(window.openUserManager) window.openUserManager();
    }
};