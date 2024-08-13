import React, { useState } from 'react';

function IndexTest() {
    const [t, setT] = useState(1)

    const handleUpdate = () => {
        setT((i) => { return i + 1 })
        // setT(3)
    }

    return (
        <div>
            <p>p标签内容</p>
            <span>{t}</span>
            <button onClick={handleUpdate}>useState更新</button>
        </div>
    )
}

export default IndexTest