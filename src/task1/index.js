/*
* Задача 1
*
*/

getData = () => {
	let price = Math.floor(Math.random() * 2000);
	let time = Math.random() * 2000;
	console.log('Loading item. Will wait ' + time.toFixed(0)+'ms. Price: ' + price);
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			// Добавил кейс с reject-ом
			if(time > 1800) reject('error more then 1800');
			resolve({price});
		}, time);
	});
};

// Количество продуктом которые хотим получить из сервера
const productCount = 12;

/*
* Функция generatePromises() получает количество продуктов и возвращает массив с промисами
* Длина массива зависит от количество продуктов
*
*/

function generatePromises(productCount){
	const promisesArr = [];
	for (let i = 0; i < productCount; i++){
		promisesArr.push(getData());
	}
	return promisesArr;
}

/*
* Функция customPromiseAll() принимает массив с промисами и выполняет их
* Если в промисах нет возвращающих reject, то функция собирает все результати промисов
* и резолвит их в качестве массива.
* Если присутствие хот 1 reject, то все отменяется.
*/

const customPromiseAll = function(promises) {
	let results = [];
	let completedPromises = 0;
	return new Promise(function (resolve, reject) {
		promises.forEach(function(promise, index) {
			promise.then(function (value) {
				results[index] = value;
				completedPromises += 1;
				if(completedPromises === promises.length) {
					resolve(results);
				}
			}).catch(function (error) {
				reject(error);
			});
		});
	});
}

/*
* Получаем результат с customPromiseAll() и дальше работаем с ним.
* Сортируем полученные продукты по возрастанию цен и
* посчитаем все цену для всех продуктом.
*/

let promises = customPromiseAll(generatePromises(productCount));

promises.then(function (result){
	let sortedProd = result.sort((a, b) => {
		return a.price - b.price;
	})
	console.log('sortedProd', sortedProd)

	let pricesSum = result.reduce((acc, cur) => {
		return acc + cur.price;
	}, 0);
	console.log('pricesSum', pricesSum)
});

