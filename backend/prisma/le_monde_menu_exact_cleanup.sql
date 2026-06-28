-- Le Monde Steak - clean menu data and restore official products.
-- Run this in Supabase SQL Editor.
-- It keeps only the 9 food groups and 43 products from the provided menu screenshots.
-- It also replaces demo/old combos with Le Monde Steak combos.

alter table public.categories add column if not exists "categoryName" text;
alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists image text;
alter table public.categories add column if not exists "sortOrder" integer not null default 0;
alter table public.categories add column if not exists "isActive" boolean not null default true;
alter table public.categories add column if not exists "createdAt" timestamptz not null default now();
alter table public.categories add column if not exists "updatedAt" timestamptz not null default now();

alter table public.items add column if not exists description text;
alter table public.items add column if not exists price double precision not null default 0;
alter table public.items add column if not exists image text;
alter table public.items add column if not exists "categoryId" text;
alter table public.items add column if not exists "isAvailable" boolean not null default true;
alter table public.items add column if not exists "sortOrder" integer not null default 0;
alter table public.items add column if not exists "isActive" boolean not null default true;
alter table public.items add column if not exists "createdAt" timestamptz not null default now();
alter table public.items add column if not exists "updatedAt" timestamptz not null default now();

alter table public.combos add column if not exists description text;
alter table public.combos add column if not exists price double precision not null default 0;
alter table public.combos add column if not exists image text;
alter table public.combos add column if not exists "isActive" boolean not null default true;
alter table public.combos add column if not exists "createdAt" timestamptz not null default now();
alter table public.combos add column if not exists "updatedAt" timestamptz not null default now();

insert into public.categories (id, "categoryName", description, image, "sortOrder", "isActive")
values
  ('cat_petit_classique', 'Petit Classique', 'Các món steak phong cách Pháp cổ điển.', null, 1, true),
  ('cat_gu_steak_co_dien', 'Gu Steak Cổ Điển', 'Hương vị Pháp kinh điển, đậm chất bistro truyền thống.', null, 2, true),
  ('cat_gu_steak_dong_vui', 'Gu Steak Đông Vui', 'Phần steak định lượng lớn, ăn cùng nhiều gu sốt để chia sẻ.', null, 3, true),
  ('cat_gu_steak_sang_tao', 'Gu Steak Sáng Tạo', 'Hương vị khác biệt từ sự pha trộn Á - Âu.', null, 4, true),
  ('cat_rau_cu_ap_chao', 'Rau Củ Áp Chảo', 'Rau củ áp chảo dùng kèm món chính.', null, 5, true),
  ('cat_salad', 'Salad', 'Salad tươi mát và món khai vị.', null, 6, true),
  ('cat_pasta', 'Pasta', 'Mỳ Ý sốt đặc trưng.', null, 7, true),
  ('cat_pizza', 'Pizza', 'Pizza và món nướng phô mai.', null, 8, true),
  ('cat_do_chien', 'Đồ Chiên', 'Các món chiên dùng kèm.', null, 9, true)
on conflict (id) do update set
  "categoryName" = excluded."categoryName",
  description = excluded.description,
  image = excluded.image,
  "sortOrder" = excluded."sortOrder",
  "isActive" = excluded."isActive",
  "updatedAt" = now();

insert into public.items (id, name, description, price, image, "categoryId", "isAvailable", "sortOrder", "isActive")
values
  ('item_rossini', 'Rossini', 'Thăn bò phi lê ăn cùng gan ngỗng béo Pháp, khoai nghiền và sốt rượu vang Burgundy.', 299000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577603/rossini_g9knjo.png', 'cat_petit_classique', true, 1, true),
  ('item_suft_turf', 'Suft & Turf', 'Thăn bò phi lê ăn cùng tôm áp chảo, măng tây và khoai nghiền ăn cùng sốt tiêu Phú Quốc.', 279000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577603/suft_turf_iqvw5o.png', 'cat_petit_classique', true, 2, true),
  ('item_petit_classique', 'Petit Classique', 'Thăn bò phi lê ăn cùng măng tây, khoai nghiền và sốt tùy chọn.', 229000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577600/petitclassique_w5svmv.png', 'cat_petit_classique', true, 3, true),
  ('item_steak_diane', 'Steak Diane', 'Thăn ngoại 180g sốt Diane nấu từ nấm Porcini, nấm mỡ tươi và rượu Cognac, ăn kèm măng tây áp chảo.', 279000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577601/steakdiane_ojqbzq.png', 'cat_gu_steak_co_dien', true, 4, true),
  ('item_steak_au_poivre', 'Steak Au Poivre', 'Thăn ngoại 180g áp chảo phủ tiêu xanh Phú Quốc ăn kèm măng tây và khoai bỏ lò.', 279000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577597/steakaupoirve_hy2fcd.png', 'cat_gu_steak_co_dien', true, 5, true),
  ('item_steak_au_vin_rouge', 'Steak Au Vin Rouge', 'Steak thăn ngoại 180g sốt rượu vang đỏ ăn kèm khoai nghiền và hành caramelisé.', 259000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577597/steakauvinrouge_oztkxi.png', 'cat_gu_steak_co_dien', true, 6, true),
  ('item_steak_frite', 'Steak & Frite', 'Steak thăn ngoại 180g sốt tiêu Phú Quốc ăn kèm khoai tây chiên.', 249000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577594/steak_frite_w7w63d.png', 'cat_gu_steak_co_dien', true, 7, true),
  ('item_steak_de_bistro', 'Steak De Bistro', 'Bò áp chảo sốt tự chọn ăn kèm rau củ theo mùa và khoai nghiền hoặc khoai chiên.', 239000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577598/steakdebistro_ewvtlh.png', 'cat_gu_steak_co_dien', true, 8, true),
  ('item_saumon_steak', 'Saumon Steak', 'Steak cá hồi sốt hải sản miền Nam nước Pháp ăn kèm măng tây.', 229000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577593/saumonsteak_di8kv5.png', 'cat_gu_steak_co_dien', true, 9, true),
  ('item_steak_than_ngoai_bo', 'Steak Thăn Ngoại Bò', 'Steak thăn ngoại bò 360g sốt tự chọn, ăn kèm đồ chiên và rau củ nướng theo mùa.', 449000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577592/steakthanngoaibo_vcjjt1.png', 'cat_gu_steak_dong_vui', true, 10, true),
  ('item_steak_than_ngoai_bo_heo_cot_let', 'Steak Thăn Ngoại Bò & Heo Cốt Lết', 'Thăn ngoại bò 180g và heo cốt lết 220g sốt tự chọn, ăn kèm đồ chiên, rau củ nướng theo mùa.', 379000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577589/steakthanngoaibo_heocotlet_rjuym2.png', 'cat_gu_steak_dong_vui', true, 11, true),
  ('item_steak_than_ngoai_bo_ca_hoi', 'Steak Thăn Ngoại Bò & Cá Hồi', 'Thăn ngoại bò 180g và cá hồi 150g sốt tự chọn, ăn kèm đồ chiên, rau củ nướng theo mùa.', 399000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577587/steakthanngoaibo_cahoi_cy9mga.png', 'cat_gu_steak_dong_vui', true, 12, true),
  ('item_steak_than_ngoai_bo_ma_dui_ga', 'Steak Thăn Ngoại Bò & Má Đùi Gà', 'Thăn ngoại bò 180g và má đùi gà 180g ăn cùng khoai chiên, rau củ nướng theo mùa.', 349000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577590/steakthanngoaibo_maduiga_ybyv3j.png', 'cat_gu_steak_dong_vui', true, 13, true),
  ('item_steak_heo_cot_let_ma_dui_ga', 'Steak Heo Cốt Lết & Má Đùi Gà', 'Heo cốt lết và má đùi gà ăn cùng đồ chiên, rau củ nướng theo mùa.', 249000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577586/steakheocotlet_maduiga_jagjgd.png', 'cat_gu_steak_dong_vui', true, 14, true),
  ('item_steak_mini_than_ngoai_sot_teriyaki_combo', 'Steak Mini Thăn Ngoại Sốt Teriyaki & Combo', 'Xiên thăn ngoại bò sốt Teriyaki ăn cùng cơm bơ và trứng chiên kiểu Pháp.', 159000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577585/steak_mini_thanngoaisotteriyaki_combo_ilxuwi.png', 'cat_gu_steak_sang_tao', true, 15, true),
  ('item_steak_suon_cot_let_sot_tieu_phu_quoc', 'Steak Sườn Cốt Lết Sốt Tiêu Phú Quốc', 'Sườn cốt lết 220g ăn cùng khoai chiên và sốt tiêu Phú Quốc.', 179000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577581/steaksuoncotletsottieuphuquoc_y4xu0h.png', 'cat_gu_steak_sang_tao', true, 16, true),
  ('item_steak_than_ngoai_combo', 'Steak Thăn Ngoại & Combo', 'Thăn ngoại bò 140g ăn cùng cơm bơ, trứng chiên kiểu Pháp, rau củ theo mùa và sốt tự chọn.', 179000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577583/steakthanngoai_combo_ycnm15.png', 'cat_gu_steak_sang_tao', true, 17, true),
  ('item_steak_suon_cot_let_combo', 'Steak Sườn Cốt Lết & Combo', 'Sườn cốt lết 220g ăn cùng cơm bơ, trứng chiên kiểu Pháp, rau củ theo mùa và sốt Teri.', 179000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577580/steaksuoncotlet_combo_w22tyg.png', 'cat_gu_steak_sang_tao', true, 18, true),
  ('item_steak_ca_hoi_combo', 'Steak Cá Hồi & Combo', 'Cá hồi 150g ăn cùng cơm bơ, trứng chiên kiểu Pháp, rau củ theo mùa và sốt Teri.', 199000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577573/steakcahoi_combo_fso36i.png', 'cat_gu_steak_sang_tao', true, 19, true),
  ('item_steak_ca_hoi', 'Steak Cá Hồi', 'Cá hồi 150g ăn cùng Pasta và sốt hải sản miền Nam nước Pháp.', 199000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577575/steakcahoi_ikyyud.png', 'cat_gu_steak_sang_tao', true, 20, true),
  ('item_steak_ma_dui_ga_nam_mo_ap_chao', 'Steak Má Đùi Gà & Nấm Mỡ Áp Chảo', 'Má đùi gà 180g, nấm mỡ áp chảo, khoai nghiền và sốt nấm thông Pháp.', 149000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577578/steakmaduiga_nammoapchao_c0psid.png', 'cat_gu_steak_sang_tao', true, 21, true),
  ('item_steak_ma_dui_ga_combo', 'Steak Má Đùi Gà & Combo', 'Má đùi gà 180g ăn cùng cơm bơ, trứng chiên kiểu Pháp, rau củ theo mùa và sốt Teri.', 119000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577577/steakmaduiga_combo_uy2wgw.png', 'cat_gu_steak_sang_tao', true, 22, true),
  ('item_steak_luon_vit', 'Steak Lườn Vịt', 'Lườn vịt 200g ăn cùng khoai nghiền, hành caramelisé và sốt rượu vang.', 179000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577577/steakluonvit_qs155y.png', 'cat_gu_steak_sang_tao', true, 23, true),
  ('item_mang_tay_khoai_tay_bi_ap_chao', 'Măng Tây & Khoai Tây Bi Áp Chảo', 'Măng tây và khoai tây bi áp chảo.', 89000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577569/mangtay_khoaitaybiapchao_wnd7iy.png', 'cat_rau_cu_ap_chao', true, 24, true),
  ('item_nam_mo_mang_tay_ap_chao', 'Nấm Mỡ & Măng Tây Áp Chảo', 'Nấm mỡ và măng tây áp chảo.', 99000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577569/nammo_mangtayapchao_j6jsu3.png', 'cat_rau_cu_ap_chao', true, 25, true),
  ('item_salad_hoa_qua_nhiet_doi_burrata', 'Salad Hoa Quả Nhiệt Đới Với Burrata', 'Salad hoa quả nhiệt đới ăn cùng phô mai Burrata.', 229000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577564/saladhoaquanhietdoiburrata_a7e7xu.png', 'cat_salad', true, 26, true),
  ('item_salad_hoa_qua_nhiet_doi', 'Salad Hoa Quả Nhiệt Đới', 'Salad hoa quả nhiệt đới tươi mát.', 99000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577562/saladhoaquanhietdoi_qlojxu.png', 'cat_salad', true, 27, true),
  ('item_salad_bistro_phap', 'Salad Bistro Pháp', 'Salad phong cách bistro Pháp.', 119000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577559/saladbistrophap_aoy1v3.png', 'cat_salad', true, 28, true),
  ('item_salad_caesar', 'Salad Caesar', 'Salad Caesar với rau xanh, trứng và phô mai.', 89000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577560/saladcaesar_svc0h3.png', 'cat_salad', true, 29, true),
  ('item_salad_luon_vit_xong_khoi', 'Salad Lườn Vịt Xông Khói', 'Salad ăn cùng lườn vịt xông khói.', 139000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577567/saladluonvitxongkhoi_dcsog7.png', 'cat_salad', true, 30, true),
  ('item_luon_vit_xong_khoi', 'Lườn Vịt Xông Khói', 'Lườn vịt xông khói dùng kèm salad hoặc món chính.', 119000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577558/luonvitxongkhoi_duzzr3.png', 'cat_salad', true, 31, true),
  ('item_salad_hoa_qua_theo_mua_burrata', 'Salad Hoa Quả Theo Mùa Với Burrata', 'Salad hoa quả theo mùa ăn cùng Burrata.', 219000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577565/saladhoaquatheomuaburrata_nbrkzk.png', 'cat_salad', true, 32, true),
  ('item_salad_hoa_qua_theo_mua', 'Salad Hoa Quả Theo Mùa', 'Salad hoa quả theo mùa.', 99000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577564/saladhoaquatheomua_efoipa.png', 'cat_salad', true, 33, true),
  ('item_my_y_sot_bo_bam', 'Mỳ Ý Sốt Bò Băm', 'Mỳ Ý sốt bò băm.', 129000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577555/myysotbobam_eggdgv.png', 'cat_pasta', true, 34, true),
  ('item_my_y_sot_kem_nam', 'Mỳ Ý Sốt Kem Nấm', 'Mỳ Ý sốt kem nấm.', 129000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577557/myysotkemnam_aprdvp.png', 'cat_pasta', true, 35, true),
  ('item_my_y_ca_hoi_muc_sot_tomyum', 'Mỳ Ý Cá Hồi & Mực Sốt Tomyum', 'Mỳ Ý cá hồi và mực sốt Tomyum.', 149000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577554/myycahoi_mucsottomyum_de8mjy.png', 'cat_pasta', true, 36, true),
  ('item_pizza_dua_xuc_xich', 'Pizza Dứa, Xúc Xích', 'Pizza dứa và xúc xích.', 159000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577552/pizzaduaxucxich_ojdwik.png', 'cat_pizza', true, 37, true),
  ('item_pizza_bo_bam', 'Pizza Bò Băm', 'Pizza bò băm phủ phô mai.', 159000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577553/pizzabobam_ddaskl.png', 'cat_pizza', true, 38, true),
  ('item_pizza_gap_nhan_pho_mai_bo_bam', 'Pizza Gập Nhân Phô Mai Bò Băm', 'Pizza gập nhân phô mai bò băm.', 159000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577554/pizzagapnhanphomaibobam_q7i0tq.png', 'cat_pizza', true, 39, true),
  ('item_dia_chien_tong_hop', 'Đĩa Chiên Tổng Hợp', 'Đĩa chiên tổng hợp dùng kèm sốt.', 159000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577533/diachientonghop_r6tuqh.png', 'cat_do_chien', true, 40, true),
  ('item_kid_combo_com_pho_mai_bo_bam', 'Kid Combo & Cơm Phô Mai Bò Băm', 'Combo trẻ em với cơm phô mai bò băm.', 99000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577534/kidcombo_comphomaibobam_zqlbm2.png', 'cat_do_chien', true, 41, true),
  ('item_ga_chien_dac_biet', 'Gà Chiên Đặc Biệt', 'Gà chiên đặc biệt ăn cùng khoai tây.', 99000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577534/gachiendacbiet_hfzxye.png', 'cat_do_chien', true, 42, true),
  ('item_steak_mini_than_ngoai_bo_sot_teriyaki', 'Steak Mini Thăn Ngoại Bò Sốt Teriyaki', 'Steak mini thăn ngoại bò sốt Teriyaki.', 199000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577535/Steak_mini_thanbongoaisotteriyaki_o2p0dz.png', 'cat_do_chien', true, 43, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  image = excluded.image,
  "categoryId" = excluded."categoryId",
  "isAvailable" = excluded."isAvailable",
  "sortOrder" = excluded."sortOrder",
  "isActive" = excluded."isActive",
  "updatedAt" = now();

do $$
begin
  if to_regclass('public.comboitems') is not null then
    execute $sql$
      delete from public.comboitems
      where "comboId" not in (
        'combo_petit_classique',
        'combo_co_dien',
        'combo_dong_vui',
        'combo_sang_tao',
        'combo_family'
      )
      or "itemId" not in (
        'item_rossini','item_suft_turf','item_petit_classique','item_steak_diane','item_steak_au_poivre','item_steak_au_vin_rouge',
        'item_steak_frite','item_steak_de_bistro','item_saumon_steak','item_steak_than_ngoai_bo','item_steak_than_ngoai_bo_heo_cot_let',
        'item_steak_than_ngoai_bo_ca_hoi','item_steak_than_ngoai_bo_ma_dui_ga','item_steak_heo_cot_let_ma_dui_ga',
        'item_steak_mini_than_ngoai_sot_teriyaki_combo','item_steak_suon_cot_let_sot_tieu_phu_quoc','item_steak_than_ngoai_combo',
        'item_steak_suon_cot_let_combo','item_steak_ca_hoi_combo','item_steak_ca_hoi','item_steak_ma_dui_ga_nam_mo_ap_chao',
        'item_steak_ma_dui_ga_combo','item_steak_luon_vit','item_mang_tay_khoai_tay_bi_ap_chao','item_nam_mo_mang_tay_ap_chao',
        'item_salad_hoa_qua_nhiet_doi_burrata','item_salad_hoa_qua_nhiet_doi','item_salad_bistro_phap','item_salad_caesar',
        'item_salad_luon_vit_xong_khoi','item_luon_vit_xong_khoi','item_salad_hoa_qua_theo_mua_burrata','item_salad_hoa_qua_theo_mua',
        'item_my_y_sot_bo_bam','item_my_y_sot_kem_nam','item_my_y_ca_hoi_muc_sot_tomyum','item_pizza_dua_xuc_xich','item_pizza_bo_bam',
        'item_pizza_gap_nhan_pho_mai_bo_bam','item_dia_chien_tong_hop','item_kid_combo_com_pho_mai_bo_bam','item_ga_chien_dac_biet',
        'item_steak_mini_than_ngoai_bo_sot_teriyaki'
      )
    $sql$;
  end if;
end $$;

delete from public.items
where id not in (
  'item_rossini','item_suft_turf','item_petit_classique','item_steak_diane','item_steak_au_poivre','item_steak_au_vin_rouge',
  'item_steak_frite','item_steak_de_bistro','item_saumon_steak','item_steak_than_ngoai_bo','item_steak_than_ngoai_bo_heo_cot_let',
  'item_steak_than_ngoai_bo_ca_hoi','item_steak_than_ngoai_bo_ma_dui_ga','item_steak_heo_cot_let_ma_dui_ga',
  'item_steak_mini_than_ngoai_sot_teriyaki_combo','item_steak_suon_cot_let_sot_tieu_phu_quoc','item_steak_than_ngoai_combo',
  'item_steak_suon_cot_let_combo','item_steak_ca_hoi_combo','item_steak_ca_hoi','item_steak_ma_dui_ga_nam_mo_ap_chao',
  'item_steak_ma_dui_ga_combo','item_steak_luon_vit','item_mang_tay_khoai_tay_bi_ap_chao','item_nam_mo_mang_tay_ap_chao',
  'item_salad_hoa_qua_nhiet_doi_burrata','item_salad_hoa_qua_nhiet_doi','item_salad_bistro_phap','item_salad_caesar',
  'item_salad_luon_vit_xong_khoi','item_luon_vit_xong_khoi','item_salad_hoa_qua_theo_mua_burrata','item_salad_hoa_qua_theo_mua',
  'item_my_y_sot_bo_bam','item_my_y_sot_kem_nam','item_my_y_ca_hoi_muc_sot_tomyum','item_pizza_dua_xuc_xich','item_pizza_bo_bam',
  'item_pizza_gap_nhan_pho_mai_bo_bam','item_dia_chien_tong_hop','item_kid_combo_com_pho_mai_bo_bam','item_ga_chien_dac_biet',
  'item_steak_mini_than_ngoai_bo_sot_teriyaki'
);

delete from public.categories
where id not in (
  'cat_petit_classique',
  'cat_gu_steak_co_dien',
  'cat_gu_steak_dong_vui',
  'cat_gu_steak_sang_tao',
  'cat_rau_cu_ap_chao',
  'cat_salad',
  'cat_pasta',
  'cat_pizza',
  'cat_do_chien'
);

insert into public.combos (id, name, description, price, image, "isActive")
values
  ('combo_petit_classique', 'Combo Petit Classique', 'Rossini + Suft & Turf + rau củ áp chảo cho 2 người.', 599000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577603/rossini_g9knjo.png', true),
  ('combo_co_dien', 'Combo Gu Steak Cổ Điển', 'Steak Diane + Steak Au Poivre + Salad Caesar.', 599000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577601/steakdiane_ojqbzq.png', true),
  ('combo_dong_vui', 'Combo Gu Steak Đông Vui', 'Steak thăn ngoại bò & cá hồi + Steak heo cốt lết & má đùi gà.', 629000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577587/steakthanngoaibo_cahoi_cy9mga.png', true),
  ('combo_sang_tao', 'Combo Gu Steak Sáng Tạo', 'Steak cá hồi & combo + Steak sườn cốt lết & combo + salad theo mùa.', 459000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577573/steakcahoi_combo_fso36i.png', true),
  ('combo_family', 'Combo Gia Đình Le Monde', 'Đĩa chiên tổng hợp + pizza bò băm + mỳ Ý sốt bò băm + salad bistro Pháp.', 499000, 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577533/diachientonghop_r6tuqh.png', true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  image = excluded.image,
  "isActive" = excluded."isActive",
  "updatedAt" = now();

delete from public.combos
where id not in (
  'combo_petit_classique',
  'combo_co_dien',
  'combo_dong_vui',
  'combo_sang_tao',
  'combo_family'
);

do $$
begin
  if to_regclass('public.comboitems') is not null then
    execute $sql$
      insert into public.comboitems (id, "comboId", "itemId", quantity)
      values
        ('ci_petit_rossini', 'combo_petit_classique', 'item_rossini', 1),
        ('ci_petit_suft', 'combo_petit_classique', 'item_suft_turf', 1),
        ('ci_petit_veg', 'combo_petit_classique', 'item_mang_tay_khoai_tay_bi_ap_chao', 1),
        ('ci_codien_diane', 'combo_co_dien', 'item_steak_diane', 1),
        ('ci_codien_poivre', 'combo_co_dien', 'item_steak_au_poivre', 1),
        ('ci_codien_caesar', 'combo_co_dien', 'item_salad_caesar', 1),
        ('ci_dongvui_bo_ca_hoi', 'combo_dong_vui', 'item_steak_than_ngoai_bo_ca_hoi', 1),
        ('ci_dongvui_heo_ga', 'combo_dong_vui', 'item_steak_heo_cot_let_ma_dui_ga', 1),
        ('ci_sangtao_ca_hoi', 'combo_sang_tao', 'item_steak_ca_hoi_combo', 1),
        ('ci_sangtao_suon', 'combo_sang_tao', 'item_steak_suon_cot_let_combo', 1),
        ('ci_sangtao_salad', 'combo_sang_tao', 'item_salad_hoa_qua_theo_mua', 1),
        ('ci_family_chien', 'combo_family', 'item_dia_chien_tong_hop', 1),
        ('ci_family_pizza', 'combo_family', 'item_pizza_bo_bam', 1),
        ('ci_family_pasta', 'combo_family', 'item_my_y_sot_bo_bam', 1),
        ('ci_family_salad', 'combo_family', 'item_salad_bistro_phap', 1)
      on conflict (id) do update set
        "comboId" = excluded."comboId",
        "itemId" = excluded."itemId",
        quantity = excluded.quantity
    $sql$;
  end if;
end $$;

select
  (select count(*) from public.categories) as categories_count,
  (select count(*) from public.items) as items_count,
  (select count(*) from public.combos) as combos_count;
