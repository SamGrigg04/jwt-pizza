import { sleep, check, group, fail } from 'k6'
import http from 'k6/http'
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 5, duration: '30s' },
        { target: 15, duration: '1m' },
        { target: 10, duration: '30s' },
        { target: 0, duration: '30s' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
  },
}

export function scenario_1() {
  let response

  const vars = {}

  group('page_10 - https://pizza.numbrguessr.click/', function () {
    response = http.get('https://pizza.numbrguessr.click/', {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/jxl,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9,es-US;q=0.8,es;q=0.7',
        'cache-control': 'max-age=0',
        'if-modified-since': 'Thu, 12 Nov 2026 00:24:16 GMT',
        'if-none-match': '"2c83890a030b7bf86cffa9e0336ffbe9"',
        priority: 'u=0, i',
        'sec-ch-ua': '"Not-A.Brand";v="99", "Google Chrome";v="157", "Chromium";v="157"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
    })
    sleep(16.1)

    response = http.put(
      'https://pizza-service.numbrguessr.click/api/auth',
      '{"email":"d@jwt.com","password":"diner"}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9,es-US;q=0.8,es;q=0.7',
          'content-type': 'application/json',
          origin: 'https://pizza.numbrguessr.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Not-A.Brand";v="99", "Google Chrome";v="157", "Chromium";v="157"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    if (!check(response, { 'status equals 200': (response) => response.status.toString() === '200' })) {
      console.log(response.body)
      fail('Login was *not* 200')
    }
    vars['token1'] = jsonpath.query(response.json(), '$.token')[0]

    sleep(23.4)

    response = http.get('https://pizza-service.numbrguessr.click/api/order/menu', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9,es-US;q=0.8,es;q=0.7',
        authorization: `Bearer ${vars['token1']}`,
        'content-type': 'application/json',
        'if-none-match': 'W/"1fc-cgG/aqJmHhElGCplQPSmgl2Gwk0"',
        origin: 'https://pizza.numbrguessr.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"Not-A.Brand";v="99", "Google Chrome";v="157", "Chromium";v="157"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })

    response = http.get(
      'https://pizza-service.numbrguessr.click/api/franchise?page=0&limit=20&name=*',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9,es-US;q=0.8,es;q=0.7',
          authorization: `Bearer ${vars['token1']}`,
          'content-type': 'application/json',
          'if-none-match': 'W/"5c-UrU6FPurLC0JcnOrzddwdfUXFBA"',
          origin: 'https://pizza.numbrguessr.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Not-A.Brand";v="99", "Google Chrome";v="157", "Chromium";v="157"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    sleep(3.3)

    response = http.get('https://pizza-service.numbrguessr.click/api/user/me', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9,es-US;q=0.8,es;q=0.7',
        authorization: `Bearer ${vars['token1']}`,
        'content-type': 'application/json',
        'if-none-match': 'W/"5d-joCjIdIVWhi28+hTVKkDy02ecUM"',
        origin: 'https://pizza.numbrguessr.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"Not-A.Brand";v="99", "Google Chrome";v="157", "Chromium";v="157"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })
    sleep(2.2)

    // Purchase pizza
    response = http.post(
      'https://pizza-service.numbrguessr.click/api/order',
      '{"items":[{"menuId":1,"description":"Veggie","price":0.0038}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9,es-US;q=0.8,es;q=0.7',
          authorization: `Bearer ${vars['token1']}`,
          'content-type': 'application/json',
          origin: 'https://pizza.numbrguessr.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Not-A.Brand";v="99", "Google Chrome";v="157", "Chromium";v="157"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    if (!check(response, { 'purchase status equals 200': (response) => response.status.toString() === '200' })) {
      console.log(response.body)
      fail('Purchase was *not* 200')
    }
    // Capture the pizza JWT from the purchase response
    vars['pizzaJwt'] = jsonpath.query(response.json(), '$.jwt')[0]

    sleep(1.6)

    // Verify pizza using the dynamically captured JWT
    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      JSON.stringify({ jwt: vars['pizzaJwt'] }),
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9,es-US;q=0.8,es;q=0.7',
          authorization: `Bearer ${vars['token1']}`,
          'content-type': 'application/json',
          origin: 'https://pizza.numbrguessr.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Not-A.Brand";v="99", "Google Chrome";v="157", "Chromium";v="157"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-storage-access': 'active',
        },
      }
    )
  })
}