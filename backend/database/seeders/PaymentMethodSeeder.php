<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['slug' => 'cash_on_delivery', 'name' => 'Cash on Delivery', 'is_active' => true, 'config' => null, 'sort_order' => 0],
            ['slug' => 'card', 'name' => 'Card', 'is_active' => false, 'config' => ['number' => '', 'instruction' => 'Pay via card at checkout.'], 'sort_order' => 1],
            ['slug' => 'bkash', 'name' => 'bKash', 'is_active' => true, 'config' => ['number' => '01XXXXXXXXX', 'instruction' => 'Send money to this number, then enter your number & transaction ID.'], 'sort_order' => 2],
            ['slug' => 'nagad', 'name' => 'Nagad', 'is_active' => true, 'config' => ['number' => '01XXXXXXXXX', 'instruction' => 'Send money to this number, then enter your number & transaction ID.'], 'sort_order' => 3],
            ['slug' => 'rocket', 'name' => 'Rocket', 'is_active' => true, 'config' => ['number' => '01XXXXXXXXX', 'instruction' => 'Send money to this number, then enter your number & transaction ID.'], 'sort_order' => 4],
            ['slug' => 'jolhon', 'name' => 'Jolhon / Bank Account', 'is_active' => true, 'config' => [
                'instruction' => 'Send the amount to the account below, then enter your transaction number.',
                'accountHolder' => 'Your Store Name',
                'bankName' => 'Bank Name',
                'branch' => 'Branch Name',
                'accountNumber' => 'XXXX-XXXX-XXXX',
            ], 'sort_order' => 5],
        ];

        foreach ($methods as $m) {
            PaymentMethod::updateOrCreate(
                ['slug' => $m['slug']],
                ['name' => $m['name'], 'is_active' => $m['is_active'], 'config' => $m['config'], 'sort_order' => $m['sort_order']]
            );
        }
    }
}
