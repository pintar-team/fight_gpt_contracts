import matplotlib.pyplot as plt
import random
import numpy as np


SHARE_PERCENTAGE = 30
TOTAL_SUPPLY = 1_000_000_000 
CURVE_COEFFICIENT = 3


def bonding_curve(reserve_balance, total_supply, amount, curve_coefficient):
    token_price = (reserve_balance * (1 - (1 - amount / total_supply) ** curve_coefficient)) / curve_coefficient
    return token_price

def main():
    print("params:")

    reserve_balance = (SHARE_PERCENTAGE * TOTAL_SUPPLY) // 100
    token_prices = []
    amounts = np.linspace(1, 1000, 1000)
    # amounts = [random.randint(1, 10) for _ in range(100)]

    print(f"SHARE_PERCENTAGE: {SHARE_PERCENTAGE}")
    print(f"TOTAL_SUPPLY: {TOTAL_SUPPLY} ")
    print(f"RESERVE_BALANCE: {reserve_balance}")
    print(f"CURVE_COEFFICIENT: {CURVE_COEFFICIENT}")


    for amount in amounts:
        price = bonding_curve(reserve_balance, TOTAL_SUPPLY, amount, CURVE_COEFFICIENT)
        tokens = price * amount
        # print(f"price={price}, amount: {amount}, tokens={tokens}")
        token_prices.append(tokens)
        reserve_balance -= tokens 

    plt.plot(amounts, token_prices)
    plt.title('the bonding curve price changer')
    plt.xlabel('amount of BNB')
    plt.ylabel('the token price')
    plt.show()


if __name__ == "__main__":
    main()
