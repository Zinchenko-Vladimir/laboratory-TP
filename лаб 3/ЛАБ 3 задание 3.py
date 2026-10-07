class ATMAccount:
    def __init__(self, balance, pin):
        self.__balance = balance
        self.__pin = pin

    def check_pin(self, pin):
        return self.__pin == pin

    def get_balance(self, pin):
        if self.check_pin(pin):
            print("Баланс:", self.__balance)
        else:
            print("Неверный PIN!")

    def deposit(self, amount, pin):
        if self.check_pin(pin):
            if amount > 0:
                self.__balance += amount
                print("Пополнение выполнено.")
                print("Новый баланс:", self.__balance)
            else:
                print("Сумма должна быть больше 0.")
        else:
            print("Неверный PIN!")

    def withdraw(self, amount, pin):
        if self.check_pin(pin):
            if amount <= 0:
                print("Сумма должна быть больше 0.")
            elif amount > self.__balance:
                print("Недостаточно средств!")
            else:
                self.__balance -= amount
                print("Снятие выполнено.")
                print("Новый баланс:", self.__balance)
        else:
            print("Неверный PIN!")


# Создание счета
account = ATMAccount(10000, "1234")

# Проверка PIN
pin = input("Введите PIN: ")

if account.check_pin(pin):
    print("PIN верный!")

    account.get_balance(pin)

    amount = float(input("Введите сумму для пополнения: "))
    account.deposit(amount, pin)

    amount = float(input("Введите сумму для снятия: "))
    account.withdraw(amount, pin)

else:
    print("Неверный PIN!")
