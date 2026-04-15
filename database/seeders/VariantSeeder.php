<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * VariantSeeder
 *
 * Sumber data: Sheet "Varian Oil" — HPP_Harumnya.xlsx
 *
 * Setiap variant = 1 produk parfum (nama + brand asal).
 * Ini adalah PRODUK yang dijual, bukan ingredient.
 * Fragrance Oil yang dipakai untuk membuat produk ini ada di IngredientSupplierSeeder.
 *
 * Mapping variant → fragrance oil ingredient ada di VariantRecipeSeeder.
 */
class VariantSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Format: [code, name_produk, brand_asal, gender]
        // Wanita (59 items) + Pria (24 items) dari Excel
        $variants = [
            // ── Wanita ────────────────────────────────────────────────────────
            ['SIF', 'Si Fiori', 'Giorgio Armani', 'female'],
            ['VCR', 'Vanilla Candy Rock', 'Kayali', 'female'],
            ['BOOR', 'Black Opium Over Red', 'YSL', 'female'],
            ['BIRG', 'Born In Roma Green', 'Valentino', 'female'],
            ['BSE', 'Bombshell Escape', "Victoria's Secret", 'female'],
            ['HERI', 'Her Intense', 'Burberry', 'female'],
            ['LIB', 'Libre', 'YSL', 'female'],
            ['MUSK', 'White Musk', 'The Body Shop', 'unisex'],
            ['OAM', 'Omnia Amethyste', 'Bvlgari', 'female'],
            ['FAME', 'Fame', 'Paco Rabanne', 'female'],
            ['SCN', 'Scandalous', "Victoria's Secret", 'female'],
            ['BACR', 'Baccarat Rouge 540', 'MFK', 'unisex'],
            ['EDEN', 'Eden Sparkling', 'Kayali', 'female'],
            ['CCP', 'Coconut Passion', "Victoria's Secret", 'female'],
            ['BS', 'Bombshell', "Victoria's Secret", 'female'],
            ['PERF', 'Perfect', 'Marc Jacobs', 'female'],
            ['BBTH', 'Bubble Bath', 'Maison Margiela', 'unisex'],
            ['SPOP', 'Scarlet Poppy', 'Jo Malone', 'unisex'],
            ['NOBL', 'Noble', 'Penhaligon\'s', 'female'],
            ['MWAY', 'My Way', 'Giorgio Armani', 'female'],
            ['BLOM', 'Bloom', 'Gucci', 'female'],
            ['CBREK', 'Coffee Break', 'Maison Margiela', 'unisex'],
            ['EUPH', 'Euphoria', 'Calvin Klein', 'female'],
            ['EROF', 'Eros Flame', 'Versace', 'male'],
            ['BOP', 'Black Opium', 'YSL', 'female'],
            ['CLP', 'Cloud Pink', 'Ariana Grande', 'female'],
            ['GG', 'Good Girl', 'Carolina Herrera', 'female'],
            ['GDS', 'Goddess', 'Burberry', 'female'],
            ['VR', 'Vanilla Rose', 'Mancera', 'unisex'],
            ['MWNE', 'My Way Nectar', 'Giorgio Armani', 'female'],
            ['SCND', 'Scandal', 'Jean Paul Gaultier', 'female'],
            ['MISD', 'Miss Dior', 'Christian Dior', 'female'],
            ['BBOQ', 'Blooming Bouquet', 'Christian Dior', 'female'],
            ['HER', 'Her', 'Burberry', 'female'],
            ['GGB', 'Good Girl Blush', 'Carolina Herrera', 'female'],
            ['IDOL', 'Idol Nectar', 'Lancome', 'female'],
            ['JME', 'JME Persia IBC CV', 'Jo Malone', 'female'],
            ['POPC', 'Poppy CV', 'Coach', 'female'],
            ['NAG', 'Nagita CV', '-', 'female'],
            ['TWIL', 'Twilly CV', 'Hermes', 'female'],
            ['GRT', 'Green Tea CV', '-', 'unisex'],
            ['MRT', 'Morning Tea CV', '-', 'unisex'],
            ['FLO', 'Flora Gucci', 'Gucci', 'female'],
            ['TEAS', 'Tease', "Victoria's Secret", 'female'],
            ['EAC', 'Eau Capitale', 'Diptyque', 'unisex'],
            ['FOF', 'Flight Of Fancy', 'Anna Sui', 'female'],
            ['COCO', 'Coco Mademoiselle', 'Chanel', 'female'],
            ['JPMP', 'Jmp Peony Blush', 'Jo Malone', 'female'],
            ['CLOE', 'Nomadian (Chloe Nomade)', 'Chloe', 'female'],
            ['NO5', 'No. 5', 'Chanel', 'female'],
            ['DEL', 'Delina', 'Parfums de Marly', 'female'],
            ['FLGP', 'Flora Gucci Premium', 'Gucci', 'female'],
            ['PCHF', 'Pink Chiffon SS', 'Bath & Body Works', 'female'],
            ['VLJ', 'Viva La Juicy LZ', 'Juicy Couture', 'female'],
            ['INCH', 'Incanto Shine', 'Salvatore Ferragamo', 'female'],
            ['CHTA', 'Cherry In The Air', 'Escada', 'female'],
            ['ORCH', 'Orchid', '-', 'female'],
            ['ROMW', 'Romantic Wish', 'Escada', 'female'],
            ['BLAN', 'Blanche', 'Byredo', 'female'],

            // ── Pria ──────────────────────────────────────────────────────────
            ['OML', 'One Million Lucky', 'Paco Rabanne', 'male'],
            ['BLUS', 'Blue Seduction', 'Antonio Banderas', 'male'],
            ['BLEU', 'Bleu De Chanel', 'Chanel', 'male'],
            ['MANX', 'Halloween Man X', 'Halloween', 'male'],
            ['SVG', 'Sauvage', 'Christian Dior', 'male'],
            ['ABE', 'Blue Emotion', 'Aigner', 'male'],
            ['BOPM', 'Black Opium Men', 'YSL', 'male'],
            ['SELF', 'My Self', 'YSL', 'male'],
            ['EROS', 'Eros', 'Versace', 'male'],
            ['SANT', 'Santal 33', 'Le Labo', 'unisex'],
            ['Y', 'Y', 'YSL', 'male'],
            ['WANT', 'The Most Wanted', 'Azzaro', 'male'],
            ['HERO', 'Hero', 'Burberry', 'male'],
            ['DBL', 'Desire Blue', 'Dunhill', 'male'],
            ['OMRV', 'One Million Royal', 'Paco Rabanne', 'male'],
            ['WOSS', 'Wood Sage & Salt', 'Jo Malone', 'unisex'],
            ['SCNM', 'Scandal Men', 'Jean Paul Gaultier', 'male'],
            ['SWY', 'Stronger With You', 'Giorgio Armani', 'male'],
            ['TBCO', 'Tobacco', 'Tom Ford', 'unisex'],
            ['CDIV', 'CDI Aventuro', 'Christian Dior', 'male'],
            ['SVGE', 'Svg Elixir', 'Christian Dior', 'male'],
            ['HOME', 'Homme', 'Christian Dior', 'male'],
            ['BAGN', 'Black Aigner', 'Aigner', 'male'],
            ['CAV', 'Creed Aventus', 'Creed', 'male'],
        ];

        foreach ($variants as $v) {
            $brand = $v[2] !== '-' ? $v[2] : null;
            DB::table('variants')->insert([
                'id' => Str::uuid(),
                'code' => $v[0],
                'name' => ($brand ? $brand . ' ' : '') . $v[1],
                'gender' => $v[3],
                'description' => $brand ? 'Brand: ' . $brand : null,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->command->info('✓ Variants seeded (' . count($variants) . ' variants).');
    }
}