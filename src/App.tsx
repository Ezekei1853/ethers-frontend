import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import "./global.css";

const EtherWallet = () => {
  const [blockData, setBlockData] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [successProvider, setSuccessProvider] = useState(null);
  const [connectedProvider, setConnectedProvider] = useState<any>({});
  const hasFetched = useRef<boolean>(false);
  const abortController = useRef(null);
  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };
  const getTx = async () => {
    debugger;
    if (hasFetched.current) {
      addLog("已经在请求中");
      return;
    }
    hasFetched.current = true;
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
    try {
      setLoading(true);
      setError(null);
      addLog("开始交易信息");
      const providers = [
        {
          name: "Alchemy Sepolia",
          url: "https://eth-sepolia.g.alchemy.com/v2/demo",
          priority: 1,
        },
        {
          name: "Ankr Sepolia",
          url: "https://rpc.ankr.com/eth_sepolia",
          priority: 2,
        },
        {
          name: "PublicNode Sepolia",
          url: "https://ethereum-sepolia-rpc.publicnode.com",
          priority: 3,
        },
        {
          name: "BlockPI Sepolia",
          url: "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
          priority: 4,
        },
        // 🔥 备用选项 - 可能有 CORS 问题
        {
          name: "Sepolia RPC",
          url: "https://rpc.sepolia.org",
          priority: 5,
        },
      ];

      //1.先设置provider
      let provider = null; //

      for (const providerInfo of providers) {
        try {
          const testProvider = new ethers.JsonRpcProvider(providerInfo.url);
          console.log(testProvider, "__++++");
          const netWork = testProvider.getNetwork(); //创建连接，
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error("超时"));
            }, 5000); //超时器
          });

          await Promise.race([netWork, timeoutPromise]); //做竞赛，谁完成就用谁的结果
          addLog("provider");
          provider = testProvider; //保存可用的providr,用户rpc连接
          console.log(provider, "__provider");

          setConnectedProvider(providerInfo); //设置界面渲染点信息
        } catch (error) {
          continue;
        }
      }
      if (!provider) {
        throw new Error(
          "❌ 无法连接到任何 RPC 节点。请检查网络连接或尝试使用 VPN。"
        );
      }
      const txHash =
        "0x4195419bf60b3541faa0394362d0e55281d0c51b34a9c66bfe465ed979a98267";
      const txPromise = provider.getTransaction(txHash);
      const txTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("交易查询超时")), 10000);
      });
      const tx: any = await Promise.race([txPromise, txTimeoutPromise]);//重点学习
      if (!tx) {
        throw new Error("找不到了，滚蛋");
      }

      try {
        addLog("获取交易信息");
        const receipt = await provider.getTransactionReceipt(txHash);
        console.log(receipt, "___receipt 交易数据");
        addLog("🗃️ 获取区块信息...");
        const block:any = await provider.getBlock(tx.blockNumber);
        console.log(block, "___block", "取款信息");
         const enrichedTx = {
          ...tx,
          receipt,
          blockTimestamp: new Date(block.timestamp * 1000).toLocaleString(),//时间戳
          valueInEth: ethers.formatEther(tx.value), //eth单位转换
          gasPriceInGwei: ethers.formatUnits(tx.gasPrice, 'gwei') //转换价格
        };
        debugger
        console.log(enrichedTx,'----信息info')
        setBlockData(enrichedTx);

        addLog('📊 数据处理完成！');
      } catch (error) {}
    } catch (error: any) {
      setError(error.message || error.toString(""));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getTx();
    return () => {
      if (abortController.current) {
        abortController.current?.abort();
        addLog("🧹 组件卸载，取消所有请求");
      }
    };
  }, []);
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">以太坊交易查询</h1>
      
      {/* 状态显示 */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded text-sm ${
            loading ? 'bg-blue-100 text-blue-800' : 
            error ? 'bg-red-100 text-red-800' : 
            blockData ? 'bg-green-100 text-green-800' : 'bg-gray-100'
          }`}>
            {loading ? '🔄 查询中...' : error ? '❌ 失败' : blockData ? '✅ 成功' : '⏳ 就绪'}
          </span>
          
          <button 
            onClick={() => { hasFetched.current = false; getTx(); }}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            重新查询
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-red-600 text-sm">
            错误: {error}
          </div>
        )}
      </div>

      {/* 日志 */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">查询日志:</h3>
        <div className="bg-black text-green-400 p-3 rounded h-40 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

      {/* 交易数据展示 */}
      {blockData && (
        <div className="bg-green-50 p-4 rounded border">
          <h3 className="font-bold mb-3 text-green-800">📊 链上交易数据</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <strong>交易哈希:</strong>
              <div className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
                {blockData.hash}
              </div>
            </div>
            <div>
              <strong>状态:</strong>
              <span className={`ml-2 ${blockData.receipt?.status === 1 ? 'text-green-600' : 'text-red-600'}`}>
                {blockData.receipt?.status === 1 ? '✅ 成功' : '❌ 失败'}
              </span>
            </div>
            <div><strong>区块号:</strong> {blockData.blockNumber}</div>
            <div><strong>时间:</strong> {blockData.blockTimestamp}</div>
            <div>
              <strong>发送方:</strong>
              <div className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
                {blockData.from}
              </div>
            </div>
            <div>
              <strong>接收方:</strong>
              <div className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
                {blockData.to}
              </div>
            </div>
            <div><strong>金额:</strong> <span className="text-green-600 font-semibold">{blockData.valueInEth} ETH</span></div>
            <div><strong>Gas 价格:</strong> {blockData.gasPriceInGwei} Gwei</div>
            <div><strong>Gas 限制:</strong> {blockData.gasLimit?.toString()}</div>
            <div><strong>Gas 使用:</strong> {blockData.receipt?.gasUsed?.toString()}</div>
          </div>
          
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">查看原始数据</summary>
            <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(blockData, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value, 2
              )}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default EtherWallet;
