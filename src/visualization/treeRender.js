import JSONFormatter from 'json-formatter-js';
import { select, tree, hierarchy, linkVertical } from 'd3';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling

const COLOR = {
    // beginWork
    0: 'red',
    // beginWork
    1: 'red',
    // completeWork
    2: '#66c2ff',
    // completeWork
    3: '#4CAF50',
    // update节点
    4: '#ef8fbe',
  }

export const getFiberName = (node) => {
    const displayText =
        typeof node.type === 'string'
            ? node.type // 如果是字符串，直接显示
            : typeof node.type === 'function'
                ? node.type.name // 如果是函数，显示函数的名称
                : node.tag == 3
                    ? '渲染根节点' // 如果是根节点
                    : node.tag == 1
                    ? node.constructor.name // 如果是root
                        : node.name; // 默认显示 nodeDatum.name
    return displayText
}

// D3 树形结构渲染
function renderTree(treeData, rootID = "#treeContainer", _width = 800, _height = 600) {
    if (!treeData) return null;

    // 移除旧的 SVG（如果有）
    select(rootID).select("svg").remove();

    const width = _width;
    const height = _height;

    // 创建 SVG 容器
    const svg = select(rootID)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // console.log('svg', svg)

    const g = svg.append("g")
        .attr("transform", "translate(50,50)");

    const treeLayout = tree().size([width - 100, height - 100]);

    const root = hierarchy(treeData);

    treeLayout(root);

    // 链接线条 - 垂直方向
    g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", linkVertical()
            .x(d => d.x)
            .y(d => d.y)
        );

    // 节点
    const node = g.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle")
        .attr("r", 20)
        .style("fill", d => d.data.color); // 根据节点数据中的 color 属性设置颜色

    node.append("text")
        .attr("dy", ".35em")
        .attr("x", 0)
        .text(d => d.data.name);

    node.each(function (d) {
        // 过滤掉不需要的键
        const filteredJsonData = Object.keys(d.data.record)
            // .filter(key => !key.startsWith('_'))
            .reduce((obj, key) => {
                obj[key] = d.data.record[key];
                return obj;
            }, {});
        // 保持原型链和构造名
        filteredJsonData.__proto__ = d.data.record.__proto__
        // console.log('node!!', filteredJsonData)
        // 创建一个 JSONFormatter 实例
        const formatter = new JSONFormatter(filteredJsonData, 1, {
            theme: 'dark', // 主题，可以是 'dark' 或 'light'
            hoverPreviewEnabled: false, // 启用鼠标悬停预览
            hoverPreviewArrayCount: 100, // 预览时最多显示的数组元素数量
            hoverPreviewFieldCount: 5, // 预览时最多显示的对象字段数量
            animateOpen: true, // 展开时是否使用动画
            animateClose: true, // 关闭时是否使用动画
            useToJSON: false, // 是否使用 toJSON 方法
            sortPropertiesBy: (a, b) => a.localeCompare(b) // 对象属性排序的自定义函数
        });
        // 使用 Tippy.js 为每个节点添加 Tooltip
        tippy(this, {
            content: formatter.render(), // Tooltip 内容，使用 HTML 模板
            allowHTML: true, // 允许 HTML 内容
            interactive: true, // 使 Tooltip 可交互
            arrow: true, // 显示箭头
            placement: 'bottom-start',
            appendTo: document.querySelector(rootID) || document.body,
            theme: 'black', // 主题
            maxWidth: document.body.clientWidth * 0.51,
            trigger: 'click'
        });
    });

}

let recordTree = {}
// 转换函数
const convertData = (node, pConvertedNode) => {
    if (!node) return null;

    const displayText =
        typeof node.type === 'string'
            ? node.type // 如果是字符串，直接显示
            : typeof node.type === 'function'
                ? node.type.name // 如果是函数，显示函数的名称
                : node.tag == 3
                    ? '渲染根节点' // 如果是根节点
                    : node.name; // 默认显示 nodeDatum.name


    let circleColor = '#e2dcdc'
    if (!!node._tagColor && node._tagColor >= 0) {
        circleColor = COLOR[node._tagColor]
    }

    const convertedNode = {
        name: displayText,
        children: [],
        color: circleColor,
        record: node
    };

    const convertedNodeRecord = {
        name: displayText,
        children: [],
        record: node
    };

    if (!pConvertedNode) {
        recordTree = convertedNodeRecord
    }

    // 添加子节点
    if (node.child && Object.keys(node.child).length) {
        convertedNode.children.unshift(convertData(node.child, convertedNode));

        convertedNodeRecord.children.unshift(convertData(node.child, convertedNodeRecord));
    }

    // 处理右侧兄弟节点
    if (node.sibling && Object.keys(node.sibling).length) {
        if (pConvertedNode) {
            // console.log(node.sibling)
            pConvertedNode.children.unshift(convertData(node.sibling, pConvertedNode));

            convertedNodeRecord.children.unshift(convertData(node.sibling, convertedNodeRecord));
        }
    }

    // 如果没有子节点或兄弟节点，移除 children 字段
    if (convertedNode.children.length === 0) {
        delete convertedNode.children;
    }
    if (convertedNodeRecord.children.length === 0) {
        delete convertedNodeRecord.children;
    }

    return convertedNode;
};
const getReocrdTree = () => {
    return recordTree
}

export const refreshRootTrees = (fiberRootNode, WIDTH) => {
    const rootNode = {
        name: 'FiberRootNode',
        color: 'yellow',
        record: fiberRootNode
    };

    renderTree(rootNode, '#fiberRootNode', WIDTH, 70);
}

export const refreshTrees = (fiberRootode, WIDTH) => {
    const width = WIDTH / 2

    const convertdatas = convertData(fiberRootode.current);
    renderTree(convertdatas, '#tree1', width);

    const convertdatas2 = convertData(fiberRootode.current.alternate);
    renderTree(convertdatas2, '#tree2', width);

    refreshRootTrees(fiberRootode, WIDTH)

}

export default renderTree

export { convertData, getReocrdTree }