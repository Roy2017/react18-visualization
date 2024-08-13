import { getFiberName } from './treeRender';
import JSONFormatter from 'json-formatter-js';

const TAGTYPE = {
    0: 'FunctionComponent',
    1: 'ClassComponent',
    2: 'IndeterminateComponent',
    3: 'HostRoot',
    5: 'HostComponent'
}

const explanationText = (content = '') => {
    const dom = document.querySelector('#explanation')
    dom.innerHTML = content
}
const getSibling = (currentRoot) => {
    let content = ''

    if (currentRoot.sibling !== null) {
        content = `-->${getFiberName(currentRoot.sibling)}`
        content += getSibling(currentRoot.sibling, content)
    }
    // debugger
    return content
}
export const getParents = (currentRoot) => {
    let content = ''

    if (currentRoot.return !== null) {
        content = `-->${getFiberName(currentRoot.return)}`
        content += getParents(currentRoot.return, content)
    }
    // debugger
    return content
}
/** init */
export const explanationInit = (fiberRootode) => {
    if (fiberRootode.current.child === null) {
        console.log('初始化!')
        explanationText('React初始化完成，一个React实例对应一个FiberRootNode，FiberRootNode的current会指向当前屏幕渲染内容对应的fiber树，alternate树是用来操作虚拟dom相关的，这就是双缓存树结构')
    } else {
        explanationText('更新阶段，会把current树【渲染根节点】的child复制给alternate树【渲染根节点】的child（可以根据节点颜色区分），用alternate树继续下面的render阶段的操作')
    }
}
/** beginWork */
export const explanationBeginWork = (currentRoot) => {
    let content = ''
    if (currentRoot.child === null) {
        content += `【${getFiberName(currentRoot)}】执行beginWork操作完成，没有child, 下一步进行该节点的completeWork操作（注意completeWork操作是beginWork完成后,如果child为null后马上同步执行的）`
    }
    else if (currentRoot.child.sibling !== null) {
        content += `【${getFiberName(currentRoot)}】执行beginWork操作完成，得出child【${getFiberName(currentRoot.child)}${getSibling(currentRoot.child)}】,从左往右，每个节点的sibling都指向右边的兄弟节点`

    }
    else {
        content += `【${getFiberName(currentRoot)}】执行beginWork操作完成，得出child【${getFiberName(currentRoot.child)}】`
    }

    explanationText(content)
}
export const explanationBeginWorkDetails = (value, currentRoot) => {
    const {
        step,
        currentNode,
        __debug_currentHook,
        nextChildren
    } = value || {};
    if (step == 'handleTag') {
        explanationText(`开始beginWork，当前进行的类型是${TAGTYPE[currentNode.tag]}`)
    }
    if (step == 'handleRenderWithHooks') {
        explanationHandleRenderWithHooks(currentNode, __debug_currentHook, nextChildren)
    }
    if (step == 'handleUpdateHostComponent') {
        explanationhandleUpdateHostComponent(currentNode, __debug_currentHook, nextChildren, value.isDirectTextChild)
    }
    if (step == 'handleSingleChildAgain') {
        explanationText(`因为新的jsx为单节点，进行单节点diff逻辑\n旧child的fiber的key(${currentNode.key})== 新jsx对象的key(${nextChildren.key})\n旧child的fiber的type(${currentNode.elementType}) == 新jsx对象的type(${nextChildren.type})\n所以可以复用节点${getFiberName(currentNode)}，新jsx内容的props会记录在这个新child（fiber对象）的pendingProps里面`)
    }

    if (step == 'handleReconcileChildrenArray') {
        explanationText(`因为新的jsx为多节点（数组），进行多节点diff逻辑\n新jsx内容的props会记录在这个新child（fiber对象）的pendingProps里面`)
    }
    if (step == 'handleChild') {
        explanationText(`通过把当前fiber节点【${getFiberName(currentRoot)}】的child和【${getFiberName(currentRoot)}】执行后得到的新child（jsx内容），进行diff比对，得出最终的child,`)
    }
}
/** completeWork */
export const explanationCompleteWork = (currentRoot, colorTips = '蓝色') => {
    let content = ''

    content += `【${getFiberName(currentRoot)}】执行completeWork操作，节点变为${colorTips}`

    if (currentRoot.sibling !== null) {
        content += `，由于发现兄弟节点【${getFiberName(currentRoot.sibling)}】，下一步进行【${getFiberName(currentRoot.sibling)}】的beginWork操作`
    } else {
        if (currentRoot.return === null) {
            // return回根节点
            content += `，回到根节点，render阶段的操作全部完成，下一步进行commit阶段的操作，commit操作完成后current树和alternate树会交换`
        } else {
            content += `，由于没有兄弟节点，下一步进行父节点的【${getFiberName(currentRoot.return)}】的completeWork操作`
        }

    }
    explanationText(content)
}
/** reconcile */
export const explanationScheduleUpdateOnFiber = (fiber, lane, fiberRootode) => {
    let content = ''
    const formatter = new JSONFormatter(fiber.memoizedState.queue.pending, 1, {
        theme: 'light', // 主题，可以是 'dark' 或 'light'
        hoverPreviewEnabled: false, // 启用鼠标悬停预览
        hoverPreviewArrayCount: 100, // 预览时最多显示的数组元素数量
        hoverPreviewFieldCount: 5, // 预览时最多显示的对象字段数量
        animateOpen: true, // 展开时是否使用动画
        animateClose: true, // 关闭时是否使用动画
        useToJSON: false, // 是否使用 toJSON 方法
        sortPropertiesBy: (a, b) => a.localeCompare(b) // 对象属性排序的自定义函数
    });
    const updateObj = formatter.render()

    const dom = document.querySelector('#explanation')
    dom.innerHTML = ''

    content = document.createTextNode(`【${getFiberName(fiber)}】发起了若干个update,update会以环状链表的形式储存在该fiber的fiber.memoizedState.queue.pending里(可点击粉色节点查看)\n下面是当前节点存储的update环状链表↓`)
    dom.appendChild(content)
    dom.appendChild(updateObj)

    content = document.createTextNode(`优先级lanes为${lane},并且把优先级向上一级冒泡，合并到每一级的childLanes里面，直到【FiberRootNode】节点(current树和alternate树都会操作),最终合并到【FiberRootNode】节点的pendingLanes里面，冒泡路径【${getFiberName(fiber)}${getParents(fiber)} --> ${getFiberName(fiberRootode)}】\n下一步React根据FiberRootNode的pendingLanes进行调度
    `)
    dom.appendChild(content)
}

/** update */
export const explanationhandleUpdateHostComponent = (currentNode, __debug_currentHook, nextChildren, isDirectTextChild) => {
    let content = ''

    content += `由于是hostcomponent，新的child（jsx内容）直接从fiber节点的pendingProps（父级fiber节点计算后存储的）的children获取\n`
    if (isDirectTextChild) {
        content += `由于children是纯文本，纯文本无需再用fiber表示，所以新的child为null\n`
    }

    content += `得到新的child(jsx对象)↓`
    explanationText(content)

    const formatter = new JSONFormatter(nextChildren, 0, {
        theme: 'light', // 主题，可以是 'dark' 或 'light'
        hoverPreviewEnabled: false, // 启用鼠标悬停预览
        hoverPreviewArrayCount: 100, // 预览时最多显示的数组元素数量
        hoverPreviewFieldCount: 5, // 预览时最多显示的对象字段数量
        animateOpen: true, // 展开时是否使用动画
        animateClose: true, // 关闭时是否使用动画
        useToJSON: false, // 是否使用 toJSON 方法
        // sortPropertiesBy: (a, b) => a.localeCompare(b) // 对象属性排序的自定义函数
    });
    const childObj = formatter.render()
    const dom = document.querySelector('#explanation')
    dom.appendChild(childObj)
}
export const explanationHandleRenderWithHooks = (currentNode, __debug_currentHook, nextChildren) => {
    let content = ''

    content += `执行${getFiberName(currentNode)}函数，每个hook根据自己储存的updates计算出新的值，然后得到新的jsx，${getFiberName(currentNode)}函数返回新的child（即得到的新jsx内容），这个新的child给下一步的diff流程使用,下面是每个hook的具体操作↓\n`

    // 处理的hooks
    // workInProgress._debugHookTypes
    // hooks处理出来对应的值
    // __debug_currentHook

    currentNode._debugHookTypes.forEach((i, idx) => {
        content += `${idx + 1}、执行了hook【${i}】,计算出新的值为${__debug_currentHook.queue.lastRenderedState}\n`
    })

    content += `得到新的child(jsx执行后的对象)↓`

    explanationText(content)

    // 处理Symbol
    const loopFn = (curObj) => {
        const filteredJsonData = Object.keys(curObj)
            .reduce((obj, key) => {
                if (key == 'props' && Array.isArray(curObj[key]['children'])) {
                    if (!obj[key]) {
                        obj[key] = { ...curObj[key] }
                    }
                    obj[key]['children'] = curObj[key]['children']
                        .reduce((newChilds, oldObj, idx) => {
                            newChilds[idx] = loopFn(oldObj)
                            return newChilds
                        }, [])
                } else {
                    if (key.startsWith('$$')) {
                        obj[key] = curObj[key].toString();
                    } else {
                        obj[key] = curObj[key];
                    }
                }
                return obj;
            }, {});

        return filteredJsonData
    }

    const filterObj = loopFn(nextChildren)

    const formatter = new JSONFormatter(filterObj, 1, {
        theme: 'light', // 主题，可以是 'dark' 或 'light'
        hoverPreviewEnabled: false, // 启用鼠标悬停预览
        hoverPreviewArrayCount: 100, // 预览时最多显示的数组元素数量
        hoverPreviewFieldCount: 5, // 预览时最多显示的对象字段数量
        animateOpen: true, // 展开时是否使用动画
        animateClose: true, // 关闭时是否使用动画
        useToJSON: false, // 是否使用 toJSON 方法
        // sortPropertiesBy: (a, b) => a.localeCompare(b) // 对象属性排序的自定义函数
    });
    const childObj = formatter.render()
    const dom = document.querySelector('#explanation')
    dom.appendChild(childObj)
}

export default explanationText