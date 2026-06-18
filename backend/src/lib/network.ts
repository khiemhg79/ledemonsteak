import os from "os"

function privateScore(address: string, interfaceName: string) {
  const wifiBonus = /wi-?fi|wlan|wireless/i.test(interfaceName) ? 100 : 0
  if (address.startsWith("192.168.")) return wifiBonus + 30
  if (address.startsWith("10.")) return wifiBonus + 20
  const second = Number(address.split(".")[1])
  if (address.startsWith("172.") && second >= 16 && second <= 31) return wifiBonus + 10
  return -1
}

export function getLanIPv4() {
  const candidates: { address: string; score: number }[] = []
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    for (const info of addresses ?? []) {
      const isIPv4 = info.family === "IPv4"
      if (!isIPv4 || info.internal) continue
      const score = privateScore(info.address, name)
      if (score >= 0) candidates.push({ address: info.address, score })
    }
  }
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]?.address ?? "localhost"
}
