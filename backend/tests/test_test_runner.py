"""test_runner.py 单元测试"""

from app.features.request_workbench.test_runner import TestRunner


def make_response(**overrides):
    """构建测试用响应 dict"""
    data = {
        "status_code": 200,
        "headers": {"content-type": "application/json", "x-rate-limit": "100"},
        "body": '{"success": true, "data": {"id": 1}}',
        "duration": 150,
    }
    data.update(overrides)
    return data


class TestTestRunner:
    """TestRunner 核心测试"""

    def test_empty_script(self):
        """空脚本 → 无结果"""
        runner = TestRunner(make_response())
        results = runner.run("")
        assert results == []

        results = runner.run("  \n  ")
        assert results == []

    def test_tobe_pass(self):
        """toBe 断言通过"""
        runner = TestRunner(make_response())
        script = """
pm.test("状态码为 200", lambda: pm.expect(pm.response.status).toBe(200))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is True
        assert results[0]["name"] == "状态码为 200"

    def test_tobe_fail(self):
        """toBe 断言失败"""
        runner = TestRunner(make_response())
        script = """
pm.test("状态码为 404", lambda: pm.expect(pm.response.status).toBe(404))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is False
        assert "404" in results[0]["message"]

    def test_tocontain_pass(self):
        """toContain 断言通过"""
        runner = TestRunner(make_response())
        script = """
pm.test("响应包含 success", lambda: pm.expect(pm.response.body).toContain("success"))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is True

    def test_tocontain_fail(self):
        """toContain 断言失败"""
        runner = TestRunner(make_response())
        script = """
pm.test("响应包含 notfound", lambda: pm.expect(pm.response.body).toContain("notfound"))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is False

    def test_tohavestatus_pass(self):
        """toHaveStatus 断言通过"""
        runner = TestRunner(make_response())
        script = """
pm.test("状态码正确", lambda: pm.expect(pm.response.status).toHaveStatus(200))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is True

    def test_tohavestatus_fail(self):
        """toHaveStatus 断言失败"""
        runner = TestRunner(make_response())
        script = """
pm.test("状态码为 500", lambda: pm.expect(pm.response.status).toHaveStatus(500))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is False

    def test_tobejson_pass(self):
        """toBeJson 断言通过 — JSON 字符串"""
        runner = TestRunner(make_response())
        script = """
pm.test("返回 JSON", lambda: pm.expect(pm.response.body).toBeJson())
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is True

    def test_tobejson_pass_dict(self):
        """toBeJson 断言通过 — dict（json() 返回）"""
        runner = TestRunner(make_response())
        script = """
pm.test("json() 是对象", lambda: pm.expect(pm.response.json()).toBeJson())
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is True

    def test_tobejson_fail(self):
        """toBeJson 断言失败"""
        runner = TestRunner(make_response(body="not json"))
        script = """
pm.test("是 JSON", lambda: pm.expect(pm.response.body).toBeJson())
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is False

    def test_tobelessthan_pass(self):
        """toBeLessThan 断言通过"""
        runner = TestRunner(make_response())
        script = """
pm.test("响应时间 < 500ms", lambda: pm.expect(pm.response.time).toBeLessThan(500))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is True

    def test_tobelessthan_fail(self):
        """toBeLessThan 断言失败"""
        runner = TestRunner(make_response(duration=600))
        script = """
pm.test("响应时间 < 500ms", lambda: pm.expect(pm.response.time).toBeLessThan(500))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is False

    def test_multiple_tests_mixed(self):
        """多条测试混合通过/失败"""
        runner = TestRunner(make_response())
        script = """
pm.test("通过1", lambda: pm.expect(pm.response.status).toBe(200))
pm.test("失败1", lambda: pm.expect(pm.response.status).toBe(500))
pm.test("通过2", lambda: pm.expect(pm.response.body).toContain("success"))
"""
        results = runner.run(script)
        assert len(results) == 3
        passed = [r["passed"] for r in results]
        assert passed == [True, False, True]

    def test_syntax_error(self):
        """语法错误脚本"""
        runner = TestRunner(make_response())
        script = """
pm.test("语法错",
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is False
        assert "语法" in results[0]["name"] or "语法" in results[0]["message"]

    def test_environment_get_set(self):
        """环境变量读写"""
        runner = TestRunner(make_response(), {"base_url": "https://api.example.com"})
        script = """
pm.test("读取环境变量", lambda: pm.expect(pm.environment.get("base_url")).toBe("https://api.example.com"))
pm.environment.set("token", "abc123")
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is True
        assert runner.env_vars["token"] == "abc123"

    def test_toHaveHeader(self):
        """toHaveHeader 断言"""
        runner = TestRunner(make_response())
        script = """
pm.test("Content-Type 正确", lambda: pm.expect(pm.response.headers).toHaveHeader("content-type", "application/json"))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is True

    def test_response_time_property(self):
        """pm.response.time 属性"""
        runner = TestRunner(make_response(duration=250))
        script = """
pm.test("耗时是 250ms", lambda: pm.expect(pm.response.time).toBe(250))
"""
        results = runner.run(script)
        assert len(results) == 1
        assert results[0]["passed"] is True
