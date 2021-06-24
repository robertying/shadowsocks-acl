import axios from "axios";
import fs from "fs-extra";
import { exec } from "child_process";

const getUrl = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

const getDomainsFromDomainList = (list) => {
  return list
    .split("\n")
    .filter((line) => line.trim())
    .map(
      (line) => "(?:^|\\.)" + line.split("/")[1].replaceAll(".", "\\.") + "$"
    )
    .join("\n");
};

const parseGfwList = async () => {
  const script = await getUrl(
    "https://raw.githubusercontent.com/cokebar/gfwlist2dnsmasq/master/gfwlist2dnsmasq.sh"
  );
  await fs.writeFile("gfwlist2dnsmasq.sh", script);
  await new Promise((resolve, reject) =>
    exec(
      "chmod +x ./gfwlist2dnsmasq.sh && ./gfwlist2dnsmasq.sh -l -o gfwlist.txt",
      (err, stdout) => (err ? reject(err) : resolve(stdout))
    )
  );
  const result = await fs.readFile("gfwlist.txt", "utf8");
  return result.split("\n").filter((line) => line.trim()).map(
    (line) => "(?:^|\\.)" + line.replaceAll(".", "\\.") + "$"
  )
  .join("\n");;
};

const chinaIpV4 = await getUrl(
  "https://raw.githubusercontent.com/17mon/china_ip_list/master/china_ip_list.txt"
);
const chinaIpV6 = await getUrl(
  "https://raw.githubusercontent.com/gaoyifan/china-operator-ip/ip-lists/china6.txt"
);
const appleChinaDomains = await getUrl(
  "https://raw.githubusercontent.com/felixonmars/dnsmasq-china-list/master/apple.china.conf"
);
const googleChinaDomains = await getUrl(
  "https://raw.githubusercontent.com/felixonmars/dnsmasq-china-list/master/google.china.conf"
);
const chinaDomains = await getUrl(
  "https://raw.githubusercontent.com/felixonmars/dnsmasq-china-list/master/accelerated-domains.china.conf"
);
const lanList = await fs.readFile("lanlist.acl", "utf8");

const lan = lanList.trim();
const apple = getDomainsFromDomainList(appleChinaDomains);
const google = getDomainsFromDomainList(googleChinaDomains);
const china = getDomainsFromDomainList(chinaDomains);
const v4 = chinaIpV4.trim();
const v6 = chinaIpV6.trim();
const gfw = await parseGfwList()

await fs.writeFile(
  "chinalist.acl",
  `${lan}
${apple}
${google}
${china}
${v4}
${v6}
`
);

await fs.writeFile(
  "chinaiplist.acl",
  `${lan}
${v4}
${v6}
`
);

await fs.writeFile(
  "chinadomainlist.acl",
  `${lan}
${apple}
${google}
${china}
`
);

await fs.writeFile(
  "gfwlist.acl",
  `[bypass_all]

[proxy_list]
${gfw}
`
);
