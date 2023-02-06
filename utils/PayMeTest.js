module.exports = Biling = {
    //Основное назначение метода проверить доступность заказа для оплаты,
    //и сверить сумму транзакции с суммой заказа
    //также можно внести свои необходимые бизнес правила
    CheckPerformTransaction: function (params) {
        //ищем заказ в базе данных
        var order = Orders[params.account.order];
        if (!order) {
            //если заказа не существует, возвращаем ошибку -31050 .. -31099
            throw BilingErrors.OrderNotFound();
        }

        //проверяем доступен ли заказ для оплаты
        if (order.state !== 0) {
            //Если заказ уже оплачен или ожидает завершения оплаты,
            //возвращаем ошибку -31050 .. -31099
            throw BilingErrors.OrderAvailable();
        }

        //сверяем сумму заказа с суммой транзакции
        if (order.amount * 100 !== params.amount) {
            //если сумма заказа и сумма транзакции не совпадают,
            //возвращаем ошибку -31001
            throw BilingErrors.IncorrectAmount();
        }

        //Далее можно добавить необходимой бизнес логики для
        //проверки на разрешение создания транзакции

        return {
            allow: true
        };
    },

    CreateTransaction: function (params) {
        //пытаемся найти транзакцию в базе
        var transaction = Transactions[params.id];
        if (transaction) {
            //если такая транзакция уже есть в базе
            //проверяем состояние транзакции,
            if (transaction.state !== 1) {
                //если транзакция оплачена (state == 2) или отменена (state == -1|-2),
                //возвращаем ошибку -31008
                throw BilingErrors.UnexpectedTransactionState();
            }

            //если транзакция находится в начальном состоянии (state == 1)
            //возвращаем ее результат и заканчиваем выполнение метода
            return {
                state: transaction.state,
                create_time: transaction.create_time,
                transaction: transaction.transaction.toString()
            };
        }

        //если транзакции в базе нету
        try {
            //проверяем можно ли оплатить заказ  вызывая внутри метод CheckPerformTransaction
            Biling.CheckPerformTransaction(params);
        }
        catch (error) {
            //если метод CheckPerformTransaction вернул ошибку,
            //то пробрасываем ее наверх и завершаем выполнение метода CreateTransaction
            throw error;
        }

        //если заказ свободен и можно его оплатиь
        //создаем транзакцию и добовляем ее в базу
        transaction = {
            id: params.id,
            time: params.time,
            state: 1,                //ставим начальное состояние транзакции
            create_time: Date.now(), //отмечаем время когда транзакция была создана
            perform_time: 0,
            cancel_time: 0,
            transaction: TransactionsGUI++,
            order: params.account.order,
            reason: null
        };

        Transactions[params.id] = transaction;

        //блокируем заказ, чтобы его было невозможно изменить или оплатить другой транзакцией
        var order = Orders[transaction.order];
        order.state = 1;

        //возвращаем результат
        return {
            state: transaction.state,
            create_time: transaction.create_time,
            transaction: transaction.transaction.toString()
        };
    },

    PerformTransaction: function (params) {
        //пытаемся найти транзакцию в базе
        var transaction = Transactions[params.id];
        if (!transaction) {
            //если транзакция не найденна, возвращаем ошибку -31003
            throw BilingErrors.TransactionNotFound();
        }

        //если транзакция находится в начальном состоянии (state == 1)
        if (transaction.state === 1) {
            //помечаем заказ как оплаченый
            var order = Orders[transaction.order];
            order.state = 2;

            //Делаем чтото полезное

            //помечаем транзакцию завершенной
            transaction.state = 2;                  //ставим состояние транзакции в завершена (state = 2)
            transaction.perform_time = Date.now();  //отмечаем время завершения транзакции
        }

        //если транзакция завершена
        //возвращаем успешный результат
        if (transaction.state === 2) {
            return {
                state: transaction.state,
                perform_time: transaction.perform_time,
                transaction: transaction.transaction.toString()
            };
        }

        //в случае если транзакция отменена
        //возвращаем ошибку -31008
        throw BilingErrors.UnexpectedTransactionState();
    },

    CancelTransaction: function (params) {
        //пытаемся найти транзакцию в базе
        var transaction = Transactions[params.id];
        if (!transaction) {
            //если транзакция не найденна, возвращаем ошибку -31003
            throw BilingErrors.TransactionNotFound();
        }

        //Находим заказ за который была совершена транзакция
        var order = Orders[transaction.order];

        //если транзакция еще не завершена
        if (transaction.state === 1) {
            //отменяем транзакцию
            transaction.state = -1;               //помечаем транзакцию как отмененную (state = -1)
            transaction.reason = params.reason;   //ставим причину отмены
            transaction.cancel_time = Date.now(); //ставим время отмены транзакции

            //освобождаем заказ, чтобы была возможность его оплатить другой транзацией
            order.state = 0;
        }

        //если транзакция уже завершена
        //ВНИМАНИЕ: Данная часть логики, сугубо индивидуально для каждого бизнеса,
        //тут приведен общий случай
        if (transaction.state === 2) {
            //если заказ уже выполнен в полной мере и не подлежит отмене
            if (order.state === 3) {
                //возвращаем ошибку -31007
                throw BilingErrors.OrderNotСanceled();

                //если бизнес процесы позволяют отменить заказ в любой момент времени,
                //данную часть логики можно опустить
            }

            //если заказ еще возможно отменить
            if (order.state === 2) {
                transaction.state = -2;               //помечаем транзакцию отмененной (state = -2)
                transaction.reason = params.reason;   //ставим причину отмены
                transaction.cancel_time = Date.now(); //ставим время отмены транзакции

                //отменяем и блокируем заказ
                order.state = -2;

                //если бизнес процесс позволяет снова оплатить заказ после отмены
                //то можно вернуть заказ в начальное состояние,
                //чтобы его можно было снова оплатить другой транзакцией
                //order.state = 0;
            }
        }

        //возвращаем результат отмены транзакции
        return {
            state: transaction.state,
            cancel_time: transaction.cancel_time,
            transaction: transaction.transaction.toString()
        };
    },

    CheckTransaction: function (params, callback) {
        //пытаемся найти транзакцию в базе
        var transaction = Transactions[params.id];
        if (!transaction) {
            //если транзакция не найденна, возвращаем ошибку -31003
            return BilingErrors.TransactionNotFound();
        }

        //если транзакция найдена, то возвращаем все ее параметры
        return {
            state: transaction.state,
            create_time: transaction.create_time,
            perform_time: transaction.perform_time,
            cancel_time: transaction.cancel_time,
            transaction: transaction.transaction.toString(),
            reason: transaction.reason
        };
    }
};
