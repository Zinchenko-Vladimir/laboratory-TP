| № | Сценарий | Входные условия | Ожидаемый результат | Фактический результат | Статус |
|---|---|---|---|---|---|
| 1 | Корректный вход | user1 / верный пароль | 200, access_token (3 части), refresh cookie HttpOnly | 200, частей=3, HttpOnly=true | Пройден |
| 2 | Неверный пароль | user1 / wrong | 401, токены не выданы | 401, access_token=нет | Пройден |
| 3 | Пустые поля | login="", password="" | 400 | 400 | Пройден |
| 4 | Доступ без входа | GET /api/profile без токена; с мусорным токеном | 401 и 401 | 401 и 401 | Пройден |
| 5 | Выход и повторный запрос | logout; затем GET /api/profile со старым access и refresh со старым cookie | 200; 401; 401 | 200; 401; 401 | Пройден |
| 6 | Истекшая сессия (access token) | ожидание 2.3 c при TTL access 2 c; затем refresh | 401 token_expired; refresh 200; повтор запроса 200 | 401 token_expired; 200; 200 | Пройден |
| 7 | Доступ к чужому (админскому) ресурсу | user1 -> GET /api/admin/report | 403 (у admin — 200) | 403 (admin: 200) | Пройден |
| 8 | Обновление страницы после входа | POST /api/auth/refresh с refresh cookie, затем GET /api/profile | 200 (новый access), 200; refresh cookie заменён | 200, 200, cookie заменён=true | Пройден |
| 9 | JWT с подменённым payload | role=user заменён на admin, подпись прежняя | 401 bad_signature | 401, bad_signature | Пройден |
| 10 | JWT с alg=none | заголовок alg=none, подписи нет | 401 bad_algorithm | 401, bad_algorithm | Пройден |
| 11 | JWT с чужой подписью | подпись другим секретом | 401 bad_signature | 401, bad_signature | Пройден |
| 12 | Refresh без X-Requested-With | POST /api/auth/refresh без заголовка | 403 | 403 | Пройден |
| 13 | Повторное использование refresh token | старый (уже обменянный) refresh -> затем актуальный refresh той же цепочки | 401 refresh_reuse_detected; затем 401 (цепочка отозвана) | 401 refresh_reuse_detected; затем 401 | Пройден |
