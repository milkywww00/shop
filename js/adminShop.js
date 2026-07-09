import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.openAdminShop = async function(){

    const snapshot =
        await getDocs(collection(db,"shop"));

    let html=`

    <h1>상품 관리</h1>

    <button onclick="showMainPage()">

    ← 메인

    </button>

    <hr>

    <button onclick="addShopItem()">

    상품 추가

    </button>

    <hr>

    `;

    snapshot.forEach(docItem=>{

        const item=docItem.data();

        html+=`

        <div
        style="
        border:1px solid gray;
        padding:10px;
        margin:10px;
        ">

        <b>${item.name}</b>

        <br>
        가격: ${item.price}円
        <br>
        <!-- 재고 상태 가독성 좋게 표시 추가 -->
        재고: ${item.stock === -1 ? "무한 (∞)" : item.stock + "개"}

        <br><br>

        <button
        onclick="editShopItem('${docItem.id}')">

        수정

        </button>

        <button
        onclick="deleteShopItem('${docItem.id}')">

        삭제

        </button>

        </div>

        `;

    });

    document.getElementById("app").innerHTML=html;

}

// ⭐ 상품 추가 시 수량(재고) 입력 기능 추가
window.addShopItem = async function(){

    const name =
        prompt("상품 이름");

    if(!name) return;

    const price =
        Number(
            prompt("가격")
        );

    if(isNaN(price)){

        alert("가격이 올바르지 않습니다.");

        return;

    }

    const description =
        prompt("설명") || "";

    const category =
        prompt("카테고리") || "기타";

    // ⭐ 재고 입력 프롬프트 추가
    const stockInput = prompt("재고 수량을 입력하세요\n(-1을 입력하면 수량이 '무한'이 됩니다)", "-1");
    
    // 취소를 누르면 중단
    if (stockInput === null) return; 

    const stock = Number(stockInput);

    if(isNaN(stock)){
        alert("재고 수량이 올바르지 않습니다. 숫자만 입력해주세요.");
        return;
    }

    await addDoc(

        collection(db,"shop"),

        {

            name,

            price,

            description,

            category,

            stock // 사용자가 입력한 재고 값 대입

        }

    );

    alert("상품이 추가되었습니다.");

    openAdminShop();

}

window.editShopItem = async function(id){

    const snapshot =
        await getDocs(collection(db,"shop"));

    let item = null;

    snapshot.forEach(docItem=>{

        if(docItem.id===id){

            item=docItem.data();

        }

    });

    if(item==null){

        alert("상품을 찾을 수 없습니다.");

        return;

    }

    const name =
        prompt("상품 이름",item.name);

    if(!name) return;

    const price =
        Number(
            prompt("가격",item.price)
        );

    if(isNaN(price)){

        alert("가격이 올바르지 않습니다.");

        return;

    }

    const description =
        prompt(
            "설명",
            item.description||""
        );

    const category =
        prompt(
            "카테고리",
            item.category||"기타"
        );

    const stock =
        Number(
            prompt(
                "재고(-1=무한)",
                item.stock??-1
            )
        );

    if(isNaN(stock)){
        alert("재고 수량이 올바르지 않습니다.");
        return;
    }

    await updateDoc(

        doc(db,"shop",id),

        {

            name,
            price,
            description,
            category,
            stock

        }

    );

    alert("수정되었습니다.");

    openAdminShop();

}

window.deleteShopItem = async function(id){

    if(!confirm("정말 삭제하시겠습니까?")){

        return;

    }

    await deleteDoc(
        doc(db,"shop",id)
    );

    alert("삭제되었습니다.");

    openAdminShop();

}