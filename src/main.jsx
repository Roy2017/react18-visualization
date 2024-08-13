import React from 'react';
import ReactDOM from 'react-dom';
import { bindHook, utils } from 'log';
import { getFiberName, refreshTrees, refreshRootTrees } from './visualization/treeRender';
import App from './visualization/test';
import explanationText,
{
    explanationInit,
    explanationBeginWork,
    explanationCompleteWork,
    explanationScheduleUpdateOnFiber,
    explanationBeginWorkDetails
} from './visualization/explanation';
import './visualization/index.css';

let isAutoPlay = false
let ins = null
let speed = 1000

function t() {
    const WIDTH = document.querySelector('#app').clientWidth
    const HEIGHT = document.querySelector('#app').clientHeight

    let setStep = null;
    // JavaScript functions to handle button clicks
    function changeBeginwork(e) {
        console.log('changeBeginwork', e, e.target.checked);
        window.__hasBeginworkDetails = e.target.checked
    }
    function initSortItems() {
        console.log('重置');
        window.location.reload()
    }

    function play() {
        console.log('单步执行');
        // Add logic for single-step execution
        setStep(false)
    }

    function start() {
        console.log('自动执行');
        isAutoPlay = true
        doAutoPlay()
    }

    function stop() {
        console.log('暂停');
        isAutoPlay = false;
    }

    // 自动执行
    function doAutoPlay() {
        if (!isAutoPlay) return;
        setTimeout(() => {
            play();
            doAutoPlay();
        }, (speed));
    }

    // Event listeners for buttons
    document.getElementById('resetBtn').addEventListener('click', initSortItems);
    document.getElementById('stepBtn').addEventListener('click', play);
    document.getElementById('startBtn').addEventListener('click', start);
    document.getElementById('stopBtn').addEventListener('click', stop);
    document.getElementById('beginwork').addEventListener('change', changeBeginwork);

    bindHook('render-init', (setFn, fiberRootode) => {
        console.log('init', fiberRootode)
        explanationInit(fiberRootNode)
        refreshTrees(fiberRootode, WIDTH)

        setFn(true)

        setStep = setFn
    })



    bindHook('render-beginWork', (setFn, fiberRootode, currentRoot, handleBeginWork, afterBeginWorkCb) => {
        console.log('begin', handleBeginWork, currentRoot)

        setFn(true)

        explanationText(`【${getFiberName(currentRoot)}】准备执行beginWork操作`)

        const loopFn = () => {
            const res = handleBeginWork.next()
       
            if (res.done) {
                setStep = setFn
                afterBeginWorkCb(res.value)
                currentRoot._tagColor = 1
                refreshTrees(fiberRootode, WIDTH)
                explanationBeginWork(currentRoot)
            }
            else if (res.value) {
                explanationBeginWorkDetails(res.value, currentRoot)
                setStep = loopFn
            }
        }

        setStep = loopFn
    })

    bindHook('render-completeWork', (setFn, fiberRootode, currentRoot) => {
        console.log('complete', currentRoot)

        // 加标记
        if (fiberRootode.current._tagColor === null || fiberRootode.current._tagColor === 3) { // 根据根节点不同值来区分不同的render流程
            currentRoot._tagColor = 2
        } else {
            currentRoot._tagColor = 3
        }

        refreshTrees(fiberRootode, WIDTH)
        explanationCompleteWork(currentRoot, currentRoot._tagColor == 2 ? '蓝色' : '绿色')
    })

    bindHook('render-completeWork-run', (setFn, fiberRootode, completedWork, cb) => {
        setFn(true)

        console.log('render-completeWork-run', completedWork)

        const _FN = () => {
            const res = cb()
            if (res === undefined) {
                setStep = setFn
            }
            else if (res) {
                //
            }
            else if (res === null) {
                // 结束render阶段,交回给Schedule调度
                setStep = setFn
            }
        }

        setStep = _FN
    })

    bindHook('render-finish', (setFn, fiberRootode) => {
        console.log('render-finish', fiberRootode)
        refreshTrees(fiberRootode, WIDTH)

        explanationText('current树和alternate树完成交换,底部『React当前渲染的结果』位置渲染出真实的dom内容，commit阶段的可视化敬请期待!,下一步可以在底部『React当前渲染的结果』位置点击【useState更新】按钮，触发React的更新操作')

        stop()

        setStep = setFn
    })


    bindHook('scheduleUpdateOnFiber', (setFn, fiber, lane, fiberRootode, cb) => {
        console.log('scheduleUpdateOnFiber', fiber, fiberRootode)

        if (fiberRootode.current.alternate === null) { // mount不拦截
            cb()
            return
        }

        fiber._tagColor = 4
        if(fiber.alternate){
            fiber.alternate._tagColor = 4
        }

         // 刷新
         refreshTrees(fiberRootode, WIDTH)

        explanationScheduleUpdateOnFiber(fiber, lane, fiberRootode)

        setStep = cb
    })

    bindHook('ensureRootIsScheduled', (setFn, fiberRootode, nextLanes) => {
        console.log('ensureRootIsScheduled', fiberRootode)
        refreshTrees(fiberRootode, WIDTH)

        if (fiberRootode.current.alternate === null) { // mount不拦截
            return
        }

        explanationText(`检查【FiberRootNode】的pendingLanes，获取一组优先级最高的lanes，用这一组lanes发起新的render阶段，当前选出的lanes为${nextLanes}(${utils.lane2LaneName(nextLanes)})`)

        setFn(true)

        setStep = setFn
    })

    // 初始化React
    const rootEle = document.getElementById('root');
    ins = ReactDOM.createRoot(rootEle);
    const fiberRootNode = ins._internalRoot
    console.log('ins', fiberRootNode, ins)

    ins.render(<App />)

    refreshRootTrees(fiberRootNode, WIDTH);
}
t();







