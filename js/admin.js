import { db } from "./firebase.js";
import "./adminShop.js";

import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.openAdmin = async function(){
    document.getElementById("app").innerHTML=`
        <div class="container">
            <h1>⚙ 관리자 ⚙ </h1>
            <button onclick="showMainPage()">
                ← 메인
            </button>
            <br><br>
            <button onclick="openLogs()">
                로그 보기
            </button>
            <br><br>
            <button onclick="openAdminShop()">
                상점 관리
            </button>
            <br><br>
            <button onclick="openUserManager()">
                회원 관리
            </button>
            <br><br>
            <button onclick="openCreateUser()">
                새 계정 생성
            </button>
        </div>
    `;
}

window.openCreateUser = function() {
    document.getElementById("app").innerHTML = `
        <div class="container">
            <h1>새 계정 생성</h1>
            <button onclick="openAdmin()">
                ← 관리자
            </button>
            <br><br>
            
            <div style="text-align: left; max-width: 320px; margin: 0 auto;">
                <label style="font-weight: 600; font-size: 14px; color: #555; display: inline-block; margin-bottom: 5px;">아이디 (로그인용 ID)</label>
                <input id="newUserId" type="text" placeholder="예: user123" style="width: 100%; box-sizing: border-box;">
                <br><br>

                <label style="font-weight: 600; font-size: 14px; color: #555; display: inline-block; margin-bottom: 5px;">비밀번호 (6자리 이상)</label>
                <input id="newUserPw" type="password" placeholder="비밀번호 입력" style="width: 100%; box-sizing: border-box;">
                <br><br>

                <label style="font-weight: 600; font-size: 14px; color: #555; display: inline-block; margin-bottom: 5px;">이름</label>
                <input id="newUserNickname" type="text" placeholder="홍길동" style="width: 100%; box-sizing: border-box;">
                <br><br>

                <label style="font-weight: 600; font-size: 14px; color: #555; display: inline-block; margin-bottom: 5px;">초기 보유금 (円)</label>
                <input id="newUserMoney" type="number" value="0" style="width: 100%; box-sizing: border-box;">
                <br><br>
            </div>

            <button onclick="createUserSubmit()" style="background: #00b894; box-shadow: 0 4px 6px rgba(0, 184, 148, 0.2); width: 85%; max-width: 220px; margin-top: 10px;">
                계정 생성하기
            </button>
        </div>
    `;
}

window.createUserSubmit = async function() {
    const userId = document.getElementById("newUserId").value.trim();
    const password = document.getElementById("newUserPw").value.trim();
    const nickname = document.getElementById("newUserNickname").value.trim();
    const money = Number(document.getElementById("newUserMoney").value);

    if(!userId || !password || !nickname) {
        alert("아이디, 비밀번호, 이름은 필수 입력 항목입니다.");
        return;
    }

    if(password.length < 6) {
        alert("Firebase 보안 정책상 비밀번호는 최소 6자리 이상이어야 합니다.");
        return;
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if(userSnap.exists()) {
            alert("이미 존재하는 아이디입니다. 다른 아이디를 입력해주세요.");
            return;
        }

        const userEmail = `${userId}@shop.local`;
        await createUserWithEmailAndPassword(auth, userEmail, password);

        await setDoc(userRef, {
            nickname: nickname,
            password: password, 
            money: money
        });

        if (typeof window.addLog === "function") {
            await window.addLog(
                "admin",
                `관리자가 새 계정을 생성했습니다. (ID: ${userId} / 이름: ${nickname})`
            );
        }

        alert(`[${nickname}] 계정이 성공적으로 생성되었습니다!`);
        openAdmin();

    } catch (error) {
        console.error("계정 생성 중 오류 발생:", error);
        if (error.code === "auth/email-already-in-use") {
            alert("인증 시스템에 이미 등록된 아이디입니다.");
        } else {
            alert("계정 생성에 실패했습니다: " + error.message);
        }
    }
}

window.openLogs = async function(){
    const q = query(collection(db, "logs"), orderBy("time", "desc"), limit(100));
    const snapshot = await getDocs(q);

    let html=`
    <div class="container">
        <h1>📜 로그</h1>
        <button onclick="openAdmin()">← 관리자</button>
        <br><br>
        <input id="logSearch" placeholder="이름 또는 내용 검색">
        <select id="logType">
            <option value="">전체</option>
            <option value="money">지급</option>
            <option value="shop">구매</option>
            <option value="transfer">보유금 양도</option>
            <option value="itemTransfer">아이템 양도</option>
            <option value="roulette">룰렛</option>
            <option value="admin">⚙ 관리자 ⚙ </option>
        </select>
        <button onclick="filterLogs()">검색</button>
        
        <button onclick="deleteAllLogsSubmit()" style="background-color: #ff7675; margin-left: 10px;">🔴 전체삭제</button>
        
        <br><br>
        <table>
            <thead>
                <tr>
                    <th>시간</th>
                    <th>이름</th>
                    <th>종류</th>
                    <th>내용</th>
                </tr>
            </thead>
            <tbody>
    `;

    snapshot.forEach((doc)=>{
        const log=doc.data();
        let typeName = log.type;
        switch (log.type) {
            case "money": typeName = "지급"; break;
            case "shop": typeName = "구매"; break;
            case "transfer": typeName = "보유금 양도"; break;
            case "itemTransfer": typeName = "아이템 양도"; break;
            case "roulette": typeName = "룰렛"; break;
            case "admin": typeName = "⚙ 관리자 ⚙ "; break;
        }

        let timeText = "";
        if (log.time) {
            const d = log.time.toDate();
            timeText =
                d.getFullYear() + "-" +
                String(d.getMonth() + 1).padStart(2, "0") + "-" +
                String(d.getDate()).padStart(2, "0") + "<br>" +
                String(d.getHours()).padStart(2, "0") + ":" +
                String(d.getMinutes()).padStart(2, "0") + ":" +
                String(d.getSeconds()).padStart(2, "0");
        }

        html += `
        <tr class="logRow" data-type="${log.type}">
            <td>${timeText}</td>
            <td class="logNickname"><b>${log.nickname || "시스템"}</b></td>
            <td>${typeName}</td>
            <td class="logMessage">${log.message}</td>
        </tr>
        `;
    });

    html+="</tbody></table></div>";
    document.getElementById("app").innerHTML=html;
}
window.deleteAllLogsSubmit = async function () {
    const confirm1 = confirm("정말로 쌓여있는 모든 로그를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.");
    if (!confirm1) return;

    const confirm2 = prompt('정말 삭제하시려면 대문자 없이 "로그삭제" 라고 입력해 주세요.');
    if (confirm2 !== "로그삭제") {
        alert("입력한 문구가 일치하지 않아 취소합니다.");
        return;
    }

    try {
        const snapshot = await getDocs(collection(db, "logs"));
        
        if (snapshot.empty) {
            alert("삭제할 로그가 없습니다.");
            return;
        }
        let deleteCount = 0;
        for (const logDoc of snapshot.docs) {
            await deleteDoc(doc(db, "logs", logDoc.id));
            deleteCount++;
        }

        if (typeof window.addLog === "function") {
            await window.addLog("admin", `관리자가 데이터베이스의 모든 이전 로그(${deleteCount}건)를 영구 삭제했습니다.`);
        }

        alert(`총 ${deleteCount}개의 로그를 깨끗하게 삭제 완료했습니다!`);
        await openLogs();

    } catch (error) {
        console.error("로그 삭제 중 오류 발생:", error);
        alert("로그 삭제 작업 중 에러가 발생했습니다: " + error.message);
    }
};

window.filterLogs = function () {
    const keyword = document.getElementById("logSearch").value.toLowerCase();
    const type = document.getElementById("logType").value;

    document.querySelectorAll(".logRow").forEach(row => {
        const nickname = row.querySelector(".logNickname").textContent.toLowerCase();
        const message = row.querySelector(".logMessage").textContent.toLowerCase();
        const rowType = row.dataset.type;

        const keywordOK = nickname.includes(keyword) || message.includes(keyword);
        const typeOK = type === "" || rowType === type;

        row.style.display = keywordOK && typeOK ? "" : "none";
    });
}

window.openUserManager = async function () {
    const snapshot = await getDocs(collection(db, "users"));
    let html = `
    <div class="container">
        <h1>회원 관리</h1>
        <button onclick="openAdmin()">← 관리자</button>
        <br><br>
        <table>
            <thead>
                <tr>
                    <th>이름</th>
                    <th>보유금</th>
                    <th style="width: 40%;">관리</th>
                </tr>
            </thead>
            <tbody>
    `;

    snapshot.forEach((userDoc) => {
        const user = userDoc.data();
        html += `
        <tr>
            <td><b>${user.nickname}</b></td>
            <td>${user.money}円</td>
            <td>
                <button onclick="manageUser('${userDoc.id}')">관리</button>

                <button onclick="deleteUserSubmit('${userDoc.id}', '${user.nickname}')" style="background-color: #ff7675; margin-left: 5px;">삭제</button>
            </td>
        </tr>
        `;
    });

    html += "</tbody></table></div>";
    document.getElementById("app").innerHTML = html;
};

window.deleteUserSubmit = async function (userId, nickname) {
    const confirm1 = confirm(`정말로 [${nickname}] 회원을 삭제하시겠습니까?\n삭제 시 해당 유저의 정보가 전부 증발합니다.`);
    if (!confirm1) return;

    const confirm2 = prompt(`정말 삭제하시려면 유저의 아이디 [ ${userId} ] 를 정확하게 입력해 주세요.`);
    if (confirm2 !== userId) {
        alert("아이디가 일치하지 않아 삭제를 취소합니다.");
        return;
    }

    try {
        await deleteDoc(doc(db, "users", userId));

        if (typeof window.addLog === "function") {
            await window.addLog("admin", `관리자가 회원 계정을 강제 삭제 처리했습니다. (ID: ${userId} / 이름: ${nickname})`);
        }

        alert(`[${nickname}] 회원이 성공적으로 삭제되었습니다.`);
        await openUserManager(); 

    } catch (error) {
        console.error("회원 삭제 중 오류 발생:", error);
        alert("회원 삭제에 실패했습니다: " + error.message);
    }
};

window.manageUser = async function (userId) {
    const snap = await getDoc(doc(db, "users", userId));
    const user = snap.data();

    document.getElementById("app").innerHTML = `
    <div class="container">
        <h1>${user.nickname}</h1>
        <button onclick="openUserManager()">← 회원 목록</button>
        <br><br>
        현재 보유금
        <h2>${user.money}円</h2>
        <hr>
        <h3>빠른 지급 / 차감</h3>
        <button onclick="quickMoney('${userId}',100)">+100円</button>
        <button onclick="quickMoney('${userId}',1000)">+1000円</button>
        <button onclick="quickMoney('${userId}',-100)">-100円</button>
        <button onclick="quickMoney('${userId}',-1000)">-1000円</button>
        <hr>
        직접 입력
        <br><br>
        <input id="adminMoney" type="number" value="100">
        <br><br>
        <button onclick="adminGiveMoney('${userId}')">적용</button>
        <hr>
        <button onclick="openGiveItem('${userId}')">아이템 지급</button>
        <br><br>
        <button onclick="openTakeItem('${userId}')" style="background-color: #f44336; color: white;">
            아이템 회수
        </button>
        <br><br>
        <button onclick="openUserLogs('${userId}')">이 유저 로그 보기</button>
    </div>
    `;
};

window.adminGiveMoney = async function (userId) {
    const amount = Number(document.getElementById("adminMoney").value);
    if (amount === 0) { alert("0은 입력할 수 없습니다."); return; }

    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    const user = snap.data();

    await updateDoc(ref, { money: user.money + amount });
    await window.addLog("admin", `${user.nickname}에게 ${amount}円 지급`);

    alert("적용되었습니다.");
    await manageUser(userId);
};

window.quickMoney = async function(userId, amount){
    const ref = doc(db,"users",userId);
    const snap = await getDoc(ref);
    const user = snap.data();

    await updateDoc(ref,{ money:user.money+amount });
    await window.addLog("admin", `${user.nickname} ${amount>0?"+":""}${amount}円`);

    await manageUser(userId);
}

window.openGiveItem = async function(userId){
    const snapshot = await getDocs(collection(db,"shop"));

    let html=`
    <div class="container">
        <h1>아이템 지급</h1>
        <button onclick="manageUser('${userId}')">← 회원관리</button>
        <br><br>
        아이템
        <br>
        <select id="giveItem">
    `;

    snapshot.forEach((doc)=>{
        const item=doc.data();
        html+=`<option value="${doc.id}">${item.name}</option>`;
    });

    html+=`
        </select>
        <br><br>
        개수
        <br>
        <input id="giveCount" type="number" value="1" min="1">
        <br><br>
        <button onclick="giveItem('${userId}')">지급</button>
    </div>
    `;

    document.getElementById("app").innerHTML=html;
}

window.giveItem = async function(userId){
    const itemId = document.getElementById("giveItem").value;
    const count = Number(document.getElementById("giveCount").value);

    if(count<=0){ alert("1개 이상 입력하세요."); return; }

    const shopRef = doc(db,"shop",itemId);
    const shopSnap = await getDoc(shopRef);
    const item = shopSnap.data();

    const inventoryId = `${userId}_${itemId}`;
    const inventoryRef = doc(db,"inventory",inventoryId);
    const inventorySnap = await getDoc(inventoryRef);

    if(inventorySnap.exists()){
        await updateDoc(inventoryRef,{ count: inventorySnap.data().count+count });
    }else{
        await setDoc(inventoryRef,{ userId:userId, itemId:itemId, name:item.name, count:count });
    }

    await window.addLog("admin", `${item.name} ${count}개 지급`);
    alert("아이템을 지급했습니다.");
    await manageUser(userId);
}

window.openUserLogs = async function(userId){
    const q = query(collection(db,"logs"), where("userId","==",userId), orderBy("time","desc"), limit(100));
    const snapshot = await getDocs(q);
    const userSnap = await getDoc(doc(db,"users",userId));
    const user = userSnap.data();
    
    let html = `
    <div class="container">
        <h1>${user.nickname}의 로그</h1>
        <button onclick="manageUser('${userId}')">← 회원관리</button>
        <br><br>
        <table>
            <thead>
                <tr>
                    <th>시간</th>
                    <th>종류</th>
                    <th>내용</th>
                </tr>
            </thead>
            <tbody>
    `;

    snapshot.forEach((doc)=>{
        const log = doc.data();
        let timeText="";

        if(log.time){
            const d = log.time.toDate();
            timeText=
            d.getFullYear()+"-"+
            String(d.getMonth()+1).padStart(2,"0")+"-"+
            String(d.getDate()).padStart(2,"0")+"<br>"+
            String(d.getHours()).padStart(2,"0")+":"+
            String(d.getMinutes()).padStart(2,"0")+":"+
            String(d.getSeconds()).padStart(2,"0");
        }

        html+=`
        <tr>
            <td>${timeText}</td>
            <td>${log.type}</td>
            <td>${log.message}</td>
        </tr>
        `;
    });

    html+="</tbody></table></div>";
    document.getElementById("app").innerHTML=html;
}

window.openTakeItem = async function(userId){
    const q = query(collection(db, "inventory"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const userSnap = await getDoc(doc(db, "users", userId));
    const user = userSnap.data();

    let html = `
    <div class="container">
        <h1>아이템 회수 (${user.nickname})</h1>
        <button onclick="manageUser('${userId}')">← 회원관리</button>
        <br><br>
        회수할 아이템 (현재 보유 수량)
        <br>
        <select id="takeItem">
    `;

    let hasItem = false;
    snapshot.forEach((inventoryDoc) => {
        const inv = inventoryDoc.data();
        if(inv.count > 0) {
            hasItem = true;
            html += `<option value="${inventoryDoc.id}" data-max="${inv.count}" data-name="${inv.name}">${inv.name} (현재 ${inv.count}개 보유)</option>`;
        }
    });

    if(!hasItem) { html += `<option value="">보유 중인 아이템이 없습니다.</option>`; }

    html += `
        </select>
        <br><br>
        회수할 개수
        <br>
        <input id="takeCount" type="number" value="1" min="1">
        <br><br>
        <button onclick="takeItem('${userId}')" ${!hasItem ? 'disabled' : ''} style="background-color: #f44336; color: white;">회수 실행</button>
    </div>
    `;

    document.getElementById("app").innerHTML = html;
}

window.takeItem = async function(userId){
    const inventoryId = document.getElementById("takeItem").value;
    const count = Number(document.getElementById("takeCount").value);

    if(!inventoryId) { alert("회수할 아이템이 없습니다."); return; }
    if(count <= 0){ alert("1개 이상 입력하세요."); return; }

    const selectEl = document.getElementById("takeItem");
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const currentCount = Number(selectedOption.dataset.max);
    const itemName = selectedOption.dataset.name;

    if(count > currentCount) { alert(`현재 ${currentCount}개만 가지고 있습니다. 그 이상은 뺏을 수 없습니다.`); return; }

    const inventoryRef = doc(db, "inventory", inventoryId);
    const nextCount = currentCount - count;

    if(nextCount === 0) { await updateDoc(inventoryRef, { count: 0 }); } 
    else { await updateDoc(inventoryRef, { count: nextCount }); }

    const userSnap = await getDoc(doc(db, "users", userId));
    const user = userSnap.data();

    if (typeof window.addLog === "function") {
        await window.addLog("admin", `${user.nickname}의 인벤토리에서 [${itemName}] ${count}개 강제 회수`);
    }

    alert(`[${itemName}] 아이템을 ${count}개 회수했습니다.`);
    await manageUser(userId);
}