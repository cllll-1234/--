/* =================================================
   記憶重構小游戲
================================================= */


/* =================================================
   六张記憶卡
================================================= */

const memoryCards = [

    {
        id: 1,
        title: "秘密集會",
        image: "assets/scene-01.webp"
    },

    {
        id: 2,
        title: "行動開始",
        image: "assets/scene-02.webp"
    },

    {
        id: 3,
        title: "城門打開",
        image: "assets/scene-03.webp"
    },

    {
        id: 4,
        title: "異常鐘聲",
        image: "assets/scene-04.webp"
    },

    {
        id: 5,
        title: "巨人轉向",
        image: "assets/scene-05.webp"
    },

    {
        id: 6,
        title: "破牆慘劇",
        image: "assets/scene-06.webp"
    }

];


/* =================================================
   正確顺序
================================================= */

const correctOrder = [1, 2, 3, 4, 5, 6];


/* =================================================
   羅馬數字
================================================= */

const romanNumbers = [
    "Ⅰ",
    "Ⅱ",
    "Ⅲ",
    "Ⅳ",
    "Ⅴ",
    "Ⅵ"
];


/* =================================================
   第一階段变量
================================================= */

let currentOrder = [];

let normalFirstSelected = null;

let normalSecondSelected = null;

let normalLocked = false;


/* =================================================
   自動交換階段
================================================= */

let magicOrder = [];

let magicSwaps = [];

let magicIndex = 0;

let magicRound = 1;


/* =================================================
   第二階段变量
================================================= */

let blindOrder = [];

let blindStartOrder = [];

let blindFirstSelected = null;

let blindSecondSelected = null;

let chances = 2;

/* 主劇情接入时，用于区分完整恢复与殘缺結局。 */
let memoryGameSucceeded = false;

let memoryAdvanceLocked = false;

let blindLocked = false;

let secondRoundProcessing = false;


/* =================================================
   記憶播放
================================================= */

let memoryIndex = 0;


/* =================================================
   场景切換
================================================= */

function showScene(id) {

    document.querySelectorAll(".scene").forEach(scene => {

        scene.classList.remove("active");

    });


    const scene =
        document.getElementById(id);


    if (scene) {

        scene.classList.add("active");

    }

}


/* =================================================
   初始化
================================================= */

function initGame() {

    currentOrder =
        [...memoryCards].sort(
            () => Math.random() - 0.5
        );


    normalFirstSelected = null;

    normalSecondSelected = null;

    normalLocked = false;


    renderNormalCards();

}


/* =================================================
   第一階段卡牌
================================================= */

function renderNormalCards() {

    const container =
        document.getElementById("normalCards");


    if (!container) return;


    container.innerHTML = "";


    currentOrder.forEach((card, index) => {

        const slot =
            document.createElement("div");


        slot.className =
            "normalSlot";


        const roman =
            document.createElement("div");


        roman.className =
            "romanNumber";


        roman.textContent =
            romanNumbers[index];


        const cardElement =
            document.createElement("div");


        cardElement.className =
            "normalCard";


        cardElement.dataset.index =
            index;


        cardElement.innerHTML = `

            <img src="${card.image}">

            <div class="cardTitle">
                ${card.title}
            </div>

        `;


        cardElement.onclick = function () {

            selectNormalCard(index);

        };


        slot.appendChild(roman);

        slot.appendChild(cardElement);

        container.appendChild(slot);

    });

}


/* =================================================
   第一階段選擇
================================================= */

function selectNormalCard(index) {

    if (normalLocked) return;


    const cards =
        document.querySelectorAll(
            ".normalCard"
        );


    if (normalFirstSelected === null) {

        normalFirstSelected = index;

        cards[index]
            .classList
            .add("selected");

        return;

    }


    if (
        normalFirstSelected === index
    ) {

        cards[index]
            .classList
            .remove("selected");


        normalFirstSelected = null;

        return;

    }


    normalSecondSelected = index;

    cards[normalFirstSelected]
        .classList
        .remove("selected");


    normalLocked = true;


    performNormalSwap(
        normalFirstSelected,
        normalSecondSelected
    );


    normalFirstSelected = null;

    normalSecondSelected = null;

}


/* =================================================
   第一階段交換
================================================= */

function performNormalSwap(a, b) {

    const slots =
        document.querySelectorAll(
            ".normalSlot"
        );


    const cardA =
        slots[a].querySelector(
            ".normalCard"
        );


    const cardB =
        slots[b].querySelector(
            ".normalCard"
        );


    const rectA =
        cardA.getBoundingClientRect();


    const rectB =
        cardB.getBoundingClientRect();


    const moveA =
        rectB.left - rectA.left;


    const moveB =
        rectA.left - rectB.left;


    cardA.style.transition =
        "transform 0.55s ease";


    cardB.style.transition =
        "transform 0.55s ease";


    cardA.style.transform =
        `translateX(${moveA}px)`;


    cardB.style.transform =
        `translateX(${moveB}px)`;


    setTimeout(() => {

        [
            currentOrder[a],
            currentOrder[b]

        ] = [

            currentOrder[b],
            currentOrder[a]

        ];


        renderNormalCards();


        normalLocked = false;

    }, 580);

}


/* =================================================
   第一階段检查
================================================= */

function checkAnswer() {

    if (normalLocked) return;


    const correct =
        currentOrder.every(
            (card, index) =>
                card.id === correctOrder[index]
        );


    if (correct) {

        const error =
            document.getElementById(
                "errorText"
            );


        if (error) {

            error.textContent =
                "記憶已經重新拼合……";

        }


        setTimeout(() => {

            startMemoryTransition();

        }, 900);


        return;

    }


    const error =
        document.getElementById(
            "errorText"
        );


    if (error) {

        error.textContent =
            "有些記憶的先後關係還不正確……";

    }


    document
        .querySelectorAll(".normalCard")
        .forEach(card => {

            card.classList.remove(
                "wrongShake"
            );

            void card.offsetWidth;

            card.classList.add(
                "wrongShake"
            );

        });

}


/* =================================================
   病症過渡
================================================= */

function startMemoryTransition() {

    showScene("transitionScene");


    setTimeout(() => {

        startMagic();

    }, 15000);

}


/* =================================================
   開始第一次記憶紊亂
================================================= */

function startMagic() {

    magicRound = 1;

    magicOrder =
        [...correctOrder];

    magicSwaps = [];

    magicIndex = 0;


    showScene("magicScene");


    createMagicCards();


    setTimeout(() => {

        startMagicSequence();

    }, 1000);

}


/* =================================================
   自動交換卡牌
================================================= */

function createMagicCards() {

    const grid =
        document.getElementById(
            "magicGrid"
        );


    if (!grid) return;


    grid.innerHTML = "";


    magicOrder.forEach((value, index) => {

        const slot =
            document.createElement("div");


        slot.className =
            "magicSlot";


        const roman =
            document.createElement("div");


        roman.className =
            "magicRoman";


        roman.textContent =
            romanNumbers[index];


        const card =
            document.createElement("div");


        card.className =
            "magicCard";


        slot.appendChild(roman);

        slot.appendChild(card);

        grid.appendChild(slot);

    });

}


/* =================================================
   获取交換位置
================================================= */

function getSwapPair() {

    let a;

    let b;


    do {

        a =
            Math.floor(
                Math.random() * 6
            );


        b =
            Math.floor(
                Math.random() * 6
            );

    }
    while (

        a === b ||

        (
            magicSwaps.length > 0 &&

            (
                (
                    magicSwaps[
                        magicSwaps.length - 1
                    ][0] === a &&

                    magicSwaps[
                        magicSwaps.length - 1
                    ][1] === b
                )

                ||

                (
                    magicSwaps[
                        magicSwaps.length - 1
                    ][0] === b &&

                    magicSwaps[
                        magicSwaps.length - 1
                    ][1] === a
                )
            )
        )

    );


    return [a, b];

}


/* =================================================
   第一次自動交換
================================================= */

function performMagicSwap(
    a,
    b,
    duration,
    callback
) {

    const grid =
        document.getElementById(
            "magicGrid"
        );


    const slots =
        grid.querySelectorAll(
            ".magicSlot"
        );


    const cardA =
        slots[a].querySelector(
            ".magicCard"
        );


    const cardB =
        slots[b].querySelector(
            ".magicCard"
        );


    const rectA =
        cardA.getBoundingClientRect();


    const rectB =
        cardB.getBoundingClientRect();


    const moveA =
        rectB.left - rectA.left;


    const moveB =
        rectA.left - rectB.left;


    cardA.style.transition =
        `translate ${duration}ms cubic-bezier(0.22,0.61,0.36,1)`;


    cardB.style.transition =
        `translate ${duration}ms cubic-bezier(0.22,0.61,0.36,1)`;


    cardA.style.translate =
        `${moveA}px 0`;


    cardB.style.translate =
        `${moveB}px 0`;


    setTimeout(() => {

        [
            magicOrder[a],
            magicOrder[b]

        ] = [

            magicOrder[b],
            magicOrder[a]

        ];


        magicSwaps.push([a, b]);


        createMagicCards();


        callback();

    }, duration + 100);

}


/* =================================================
   五次第一次交換
================================================= */

function startMagicSequence() {

    if (magicIndex >= 5) {

        setTimeout(() => {

            startBlindPhase();

        }, 400);


        return;

    }


    const pair =
        getSwapPair();


    const a = pair[0];

    const b = pair[1];


    const progress =
        document.getElementById(
            "magicProgress"
        );


    if (progress) {

        progress.textContent =
            `第${magicIndex + 1}次交換`;

    }


    const durations = [

        2000,
        950,
        800,
        700,
        650

    ];


    performMagicSwap(
        a,
        b,
        durations[magicIndex],
        () => {

            magicIndex++;


            setTimeout(() => {

                startMagicSequence();

            }, 250);

        }
    );

}


/* =================================================
   第二階段開始
================================================= */

function startBlindPhase() {

    /*
     * 這裡非常重要：
     *
     * 保存系統完成5次交換后的最终顺序。
     */

    blindStartOrder =
        [...magicOrder];


    /*
     * 玩家实际操作的顺序。
     */

    blindOrder =
        [...blindStartOrder];


    blindFirstSelected = null;

    blindSecondSelected = null;


    chances = 2;


    blindLocked = false;

    secondRoundProcessing = false;


    showScene("blindScene");


    renderBlindCards();


    updateChanceText();


    const error =
        document.getElementById(
            "blindError"
        );


    if (error) {

        error.textContent = "";

    }

}


/* =================================================
   第二階段生成背面牌
================================================= */

function renderBlindCards() {

    const container =
        document.getElementById(
            "blindCards"
        );


    if (!container) return;


    container.innerHTML = "";


    for (
        let index = 0;
        index < blindOrder.length;
        index++
    ) {

        const slot =
            document.createElement("div");


        slot.className =
            "blindSlot";


        const roman =
            document.createElement("div");


        roman.className =
            "blindRoman";


        roman.textContent =
            romanNumbers[index];


        const card =
            document.createElement("div");


        card.className =
            "blindCard";


        card.dataset.position =
            index;


        card.onclick =
            function () {

                selectBlindCard(index);

            };


        slot.appendChild(roman);

        slot.appendChild(card);

        container.appendChild(slot);

    }

}


/* =================================================
   玩家交換背面牌
================================================= */

function selectBlindCard(index) {

    if (
        blindLocked ||
        secondRoundProcessing
    ) {

        return;

    }


    const cards =
        document.querySelectorAll(
            ".blindCard"
        );


    /*
     * 第一次點擊
     */

    if (blindFirstSelected === null) {

        blindFirstSelected = index;


        cards[index]
            .classList
            .add("blindSelected");


        return;

    }


    /*
     * 點擊同一张取消
     */

    if (
        blindFirstSelected === index
    ) {

        cards[index]
            .classList
            .remove("blindSelected");


        blindFirstSelected = null;


        return;

    }


    /*
     * 第二次點擊
     */

    blindSecondSelected = index;


    blindLocked = true;


    const a =
        blindFirstSelected;


    const b =
        blindSecondSelected;


    const cardA =
        cards[a];


    const cardB =
        cards[b];


    cardA.classList.remove(
        "blindSelected"
    );


    cardB.classList.remove(
        "blindSelected"
    );


    const rectA =
        cardA.getBoundingClientRect();


    const rectB =
        cardB.getBoundingClientRect();


    const moveA =
        rectB.left - rectA.left;


    const moveB =
        rectA.left - rectB.left;


    cardA.style.transition =
        "translate 0.55s ease";


    cardB.style.transition =
        "translate 0.55s ease";


    cardA.style.translate =
        `${moveA}px 0`;


    cardB.style.translate =
        `${moveB}px 0`;


    setTimeout(() => {

        /*
         * 真正交換后台數据。
         */

        const temp =
            blindOrder[a];


        blindOrder[a] =
            blindOrder[b];


        blindOrder[b] =
            temp;


        /*
         * 清除選擇。
         */

        blindFirstSelected = null;

        blindSecondSelected = null;


        /*
         * 重新生成牌。
         */

        renderBlindCards();


        blindLocked = false;

    }, 580);

}


/* =================================================
   检查第二階段
================================================= */

function checkSecondAnswer() {

    if (
        blindLocked ||
        secondRoundProcessing
    ) {

        return;

    }


    /*
     * 强制轉換成數字进行比较。
     *
     * 防止 "1" 和 1 類型不同造成判断失敗。
     */

    const playerOrder =
        blindOrder.map(
            value => Number(value)
        );


    const isCorrect =
        playerOrder.length === 6 &&

        playerOrder[0] === 1 &&
        playerOrder[1] === 2 &&
        playerOrder[2] === 3 &&
        playerOrder[3] === 4 &&
        playerOrder[4] === 5 &&
        playerOrder[5] === 6;


    /*
     * =================================================
     * 正確
     * =================================================
     */

    if (isCorrect) {

        showGoodEnding();

        return;

    }


    /*
     * =================================================
     * 错誤
     * =================================================
     */

    chances--;


    updateChanceText();


    const error =
        document.getElementById(
            "blindError"
        );


    /*
     * =================================================
     * 第一次失敗
     * =================================================
     */

    if (chances === 1) {

        if (error) {

            error.textContent =
                "記憶再次崩散……";

        }


        document
            .querySelectorAll(".blindCard")
            .forEach(card => {

                card.classList.remove(
                    "wrongShake"
                );

                void card.offsetWidth;

                card.classList.add(
                    "wrongShake"
                );

            });


        blindLocked = true;

        secondRoundProcessing = true;


        /*
         * 给错誤動画一點时間。
         */

        setTimeout(() => {

            /*
             * =====================================
             * 后台恢复
             * =====================================
             */

            blindOrder =
                [...blindStartOrder];


            blindFirstSelected = null;

            blindSecondSelected = null;


            /*
             * 玩家看不到恢复過程。
             */

            renderBlindCards();


            /*
             * =====================================
             * 第二次記憶紊亂
             * =====================================
             */

            setTimeout(() => {

                startSecondMemoryShuffle();

            }, 500);


        }, 700);


        return;

    }


    /*
     * =================================================
     * 第二次失敗
     * =================================================
     */

    if (chances === 0) {

        if (error) {

            error.textContent =
                "有些記憶已經無法恢復……";

        }


        document
            .querySelectorAll(".blindCard")
            .forEach(card => {

                card.classList.remove(
                    "wrongShake"
                );

                void card.offsetWidth;

                card.classList.add(
                    "wrongShake"
                );

            });


        setTimeout(() => {

            showPartialEnding();

        }, 1100);

    }

}


/* =================================================
   第二次自動交換開始
================================================= */

function startSecondMemoryShuffle() {

    /*
     * 第二轮从第一次失敗后
     * 后台恢复出來的状态開始。
     */

    blindOrder =
        [...blindStartOrder];


    const swaps = [];


    let lastA = -1;

    let lastB = -1;


    for (
        let i = 0;
        i < 5;
        i++
    ) {

        let a;

        let b;


        do {

            a =
                Math.floor(
                    Math.random() * 6
                );


            b =
                Math.floor(
                    Math.random() * 6
                );

        }
        while (

            a === b ||

            (
                a === lastB &&
                b === lastA
            )

        );


        swaps.push([a, b]);


        lastA = a;

        lastB = b;

    }


    playSecondMemoryShuffle(
        swaps,
        0
    );

}


/* =================================================
   第二次自動交換
================================================= */

function playSecondMemoryShuffle(
    swaps,
    index
) {

    /*
     * 五次交換完成
     */

    if (
        index >= swaps.length
    ) {

        blindLocked = false;

        secondRoundProcessing = false;


        const error =
            document.getElementById(
                "blindError"
            );


        if (error) {

            error.textContent =
                "記憶再次紊亂……重新拼湊它們。";

        }


        return;

    }


    const a =
        swaps[index][0];


    const b =
        swaps[index][1];


    const error =
        document.getElementById(
            "blindError"
        );


    if (error) {

        error.textContent =
            `記憶再次交換…… ${index + 1}/5`;

    }


    const durations = [

        1800,
        950,
        800,
        700,
        650

    ];


    performBlindAutoSwap(
        a,
        b,
        durations[index],
        () => {

            setTimeout(() => {

                playSecondMemoryShuffle(
                    swaps,
                    index + 1
                );

            }, 250);

        }
    );

}


/* =================================================
   第二轮自動交換
================================================= */

function performBlindAutoSwap(
    a,
    b,
    duration,
    callback
) {

    const container =
        document.getElementById(
            "blindCards"
        );


    const slots =
        container.querySelectorAll(
            ".blindSlot"
        );


    const cardA =
        slots[a].querySelector(
            ".blindCard"
        );


    const cardB =
        slots[b].querySelector(
            ".blindCard"
        );


    const rectA =
        cardA.getBoundingClientRect();


    const rectB =
        cardB.getBoundingClientRect();


    const moveA =
        rectB.left - rectA.left;


    const moveB =
        rectA.left - rectB.left;


    cardA.style.transition =
        `translate ${duration}ms cubic-bezier(0.22,0.61,0.36,1)`;


    cardB.style.transition =
        `translate ${duration}ms cubic-bezier(0.22,0.61,0.36,1)`;


    cardA.style.translate =
        `${moveA}px 0`;


    cardB.style.translate =
        `${moveB}px 0`;


    setTimeout(() => {

        /*
         * 后台真正交換。
         */

        const temp =
            blindOrder[a];


        blindOrder[a] =
            blindOrder[b];


        blindOrder[b] =
            temp;


        /*
         * 清掉動画状态。
         */

        cardA.style.translate = "";

        cardB.style.translate = "";


        /*
         * 重新生成背面牌。
         */

        renderBlindCards();


        callback();

    }, duration + 80);

}


/* =================================================
   機會顯示
================================================= */

function updateChanceText() {

    const text =
        document.getElementById(
            "chanceText"
        );


    if (text) {

        text.textContent =
            `剩餘機會：${chances}`;

    }

}


/* =================================================
   完整記憶
================================================= */

const memoryScenes = [

    {
        image:
            "assets/scene-01.webp",

        speaker:
            "卡爾",

        text:
            "等門打開以後，我要帶她去看海。",

        reply:
            "萊納：那就一起活著出去。"
    },

    {
        image:
            "assets/scene-02.webp",

        speaker:
            "系統",

        text:
            "破牆行動開始。",

        reply:
            ""
    },

    {
        image:
            "assets/scene-03.webp",

        speaker:
            "平民",

        text:
            "轟——！ 門開了！ 快出去！",

        reply:
            ""
    },

    {
        image:
            "assets/scene-04.webp",

        speaker:
            "貝爾托特",

        text:
            "等等……",

        reply:
            "鐘聲響起。"
    },

    {
        image:
            "assets/scene-05.webp",

        speaker:
            "貝爾托特",

        text:
            "巨人為什麼全都在往這裡走？",

        reply:
            ""
    },

    {
        image:
            "assets/scene-06.webp",

        speaker:
            "萊納",

        text:
            "是我打開的門……",

        reply:
            "哭喊聲、巨人吼叫聲。"
    }

];


/* =================================================
   完整結局
================================================= */

function showGoodEnding() {

    memoryGameSucceeded = true;

    showScene("memoryScene");

    memoryIndex = 0;

    playMemorySequence();

}


/* =================================================
   播放記憶
================================================= */

function playMemorySequence() {

    if (
        memoryIndex >=
        memoryScenes.length
    ) {

        setTimeout(() => {

            showScene("endingScene");


            const title =
                document.getElementById(
                    "endingTitle"
                );


            const text =
                document.getElementById(
                    "endingText"
                );


            if (title) {

                title.textContent =
                    "記憶恢復";

            }


            if (text) {

                text.textContent =
                    "我想起來了……";

            }

        }, 800);


        return;

    }


    showMemoryScene(
        memoryScenes[memoryIndex]
    );

}


/* =================================================
   顯示記憶
================================================= */

function showMemoryScene(scene) {

    const image =
        document.getElementById(
            "memoryImage"
        );


    const speaker =
        document.getElementById(
            "memorySpeaker"
        );


    const imageFallback =
        document.getElementById(
            "memoryImageFallback"
        );


    const text =
        document.getElementById(
            "memoryText"
        );


    if (image) {

        image.hidden = false;

        if (imageFallback) {

            imageFallback.hidden = true;

            imageFallback.textContent = "";

        }

        image.onload = function () {

            image.hidden = false;

            if (imageFallback) imageFallback.hidden = true;

        };

        image.onerror = function () {

            image.hidden = true;

            if (imageFallback) {

                imageFallback.textContent = scene.title || "記憶影像缺失";

                imageFallback.hidden = false;

            }

        };

        image.src =
            scene.image;

        const sceneBackdrop = document.querySelector(".memorySceneBackground");
        if (sceneBackdrop) {
            sceneBackdrop.style.backgroundImage = `url("${scene.image}")`;
        }

    }


    if (speaker) {

        speaker.textContent =
            scene.speaker;

    }


    if (text) {

        if (scene.reply) {

            text.innerHTML =
                `${scene.text}<br>${scene.reply}`;

        }
        else {

            text.textContent =
                scene.text;

        }

    }


    memoryIndex++;

}


/* =================================================
   下一段記憶
================================================= */

function nextMemoryScene() {

    const memoryScene =
        document.getElementById(
            "memoryScene"
        );


    if (
        memoryAdvanceLocked ||
        !memoryScene ||
        !memoryScene.classList.contains("active")
    ) {

        return;

    }


    memoryAdvanceLocked = true;

    playMemorySequence();


    setTimeout(() => {

        memoryAdvanceLocked = false;

    }, 180);

}


function bindMemoryPlaybackControls() {

    const memoryScene =
        document.getElementById(
            "memoryScene"
        );


    if (!memoryScene) return;


    memoryScene.addEventListener(
        "click",
        nextMemoryScene
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {

                return;

            }


            if (!memoryScene.classList.contains("active")) return;


            event.preventDefault();

            nextMemoryScene();

        }
    );

}


/* =================================================
   殘缺結局
================================================= */

function showPartialEnding() {

    memoryGameSucceeded = false;

    showScene("endingScene");


    const title =
        document.getElementById(
            "endingTitle"
        );


    const text =
        document.getElementById(
            "endingText"
        );


    if (title) {

        title.textContent =
            "記憶殘缺";

    }


    if (text) {

        text.textContent =
            "我到底……忘記了什麼？";

    }

}


/* =================================================
   返回主游戲
================================================= */

function returnToGame() {

    const params =
        new URLSearchParams(window.location.search);


    if (params.get("return") === "story") {

        try {

            localStorage.setItem(
                "TitanStory-memory-reconstruction-result",
                JSON.stringify({
                    type: "memoryReconstruction",
                    completed: true,
                    success: memoryGameSucceeded,
                    finishedAt: Date.now()
                })
            );

        }
        catch (error) {

            console.warn(
                "記憶重構結果保存失敗。",
                error
            );

        }


        window.location.href =
            "../../game.html?mode=memory-reconstruction-return";

        return;

    }

    if (
        typeof onMemoryGameComplete ===
        "function"
    ) {

        onMemoryGameComplete();

        return;

    }


    window.location.href =
        "../../index.html";

}


/* =================================================
   對外接口
================================================= */

window.startMemoryGame =
    function () {

        showScene("sortScene");

        initGame();

    };


/* =================================================
   页面加载
================================================= */

window.onload =
    function () {

        initGame();

        bindMemoryPlaybackControls();

    };
