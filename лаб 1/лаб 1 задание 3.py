deposit = float(input())
rate = float(input())
years = int(input())

result = deposit * (1 + rate / 100) ** years

print(result)
