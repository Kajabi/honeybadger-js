describe 'Honeybadger', ->
  beforeEach () ->
    Honeybadger.reset()

    # Perform immediately.
    window.setTimeout = (f) ->
      f.apply(this, arguments)

  it 'exposes it\'s prototype', ->
    proto = (obj) -> obj.constructor.prototype
    expect(Honeybadger.Client.prototype).toEqual(proto(Honeybadger))
    expect(proto(new Honeybadger.Client)).toEqual(proto(Honeybadger))

  it 'is not configured by default', ->
    expect(Honeybadger._configured).toEqual(false)

  it 'is loaded by default', ->
    expect(Honeybadger._loaded).toEqual(true)

  describe '._domReady', ->
    beforeEach () ->
      spyOn(Honeybadger, 'log')

    it 'logs once', ->
      Honeybadger._loaded = false
      Honeybadger._domReady()
      Honeybadger._domReady()
      expect(Honeybadger.log.calls.length).toEqual(1)

  it 'has a configuration object', ->
    expect(Honeybadger.configuration).toBeDefined()

  describe '.configure', ->
    it 'configures Honeybadger', ->
      expect(Honeybadger.configure).toBeDefined()

      Honeybadger.configure
        api_key: 'asdf'

      expect(Honeybadger.configuration.api_key).toEqual('asdf')

    it 'is chainable', ->
      expect(Honeybadger.configure({})).toBe(Honeybadger)

    it 'changes _configured to true', ->
      expect(Honeybadger._configured).toEqual(false)
      Honeybadger.configure
        api_key: 'asdf'
      expect(Honeybadger._configured).toEqual(true)

  it 'has a context object', ->
    expect(Honeybadger.context).toBeDefined()

  describe '.setContext', ->
    it 'merges existing context', ->
      Honeybadger.setContext({ user_id: '1' })
      Honeybadger.setContext({ foo: 'bar' })
      expect(Honeybadger.context.user_id).toBeDefined()
      expect(Honeybadger.context['user_id']).toEqual('1')
      expect(Honeybadger.context.foo).toBeDefined()
      expect(Honeybadger.context['foo']).toEqual('bar')

    it 'is chainable', ->
      expect(Honeybadger.setContext({ user_id: 1 })).toBe(Honeybadger)

    it 'does not accept non-objects', ->
      Honeybadger.setContext('foo')
      expect(Honeybadger.context).toEqual({})

    it 'keeps previous context when called with non-object', ->
      Honeybadger.setContext({ foo: 'bar' })
      Honeybadger.setContext(false)
      expect(Honeybadger.context).toEqual({ foo: 'bar' })

  describe '.resetContext', ->
    it 'empties the context with no arguments', ->
      Honeybadger.setContext({ user_id: '1' })
      Honeybadger.resetContext()
      expect(Honeybadger.context).toEqual({})

    it 'replaces the context with arguments', ->
      Honeybadger.setContext({ user_id: '1' })
      Honeybadger.resetContext({ foo: 'bar' })
      expect(Honeybadger.context).toEqual({ foo: 'bar' })

    it 'empties the context with non-object argument', ->
      Honeybadger.setContext({ foo: 'bar' })
      Honeybadger.resetContext('foo')
      expect(Honeybadger.context).toEqual({})

    it 'is chainable', ->
      expect(Honeybadger.resetContext()).toBe(Honeybadger)

  it 'responds to notify', ->
    expect(Honeybadger.notify).toBeDefined()

  describe '.notify', ->
    notice = null
    beforeEach () ->
      notice = null
      spyOn(Honeybadger, '_sendRequest').andCallFake (data) ->
        notice = data
        true

    it 'delivers the notice when enabled', ->
      Honeybadger.configure
        api_key: 'asdf'

      try
        throw new Error("Testing")
      catch e
        Honeybadger.notify(e)

      expect(Honeybadger._sendRequest).toHaveBeenCalled()

    it 'does not deliver notice when not configured', ->
      try
        throw new Error("Testing")
      catch e
        Honeybadger.notify(e)

      expect(Honeybadger._sendRequest).not.toHaveBeenCalled()

    it 'does not deliver notice when disabled', ->
      Honeybadger.configure
        api_key: 'asdf',
        disabled: true

      try
        throw new Error("Testing")
      catch e
        Honeybadger.notify(e)

      expect(Honeybadger._sendRequest).not.toHaveBeenCalled()

    it 'does not deliver notice without arguments', ->
      Honeybadger.configure
        api_key: 'asdf'

      Honeybadger.notify()
      Honeybadger.notify(null)
      Honeybadger.notify(null, {})
      Honeybadger.notify({})

      expect(Honeybadger._sendRequest).not.toHaveBeenCalled()

    it 'generates a stack trace without an error', ->
      supportsGenerate = false
      try
        throw new Error('')
      catch e
        supportsGenerate = e.stack?
      # pending('not supported in current browser') unless supportsGenerate
      # The pending function ^ does not work in IE8 apparently, so do this for now:
      return unless supportsGenerate

      Honeybadger.configure
        api_key: 'asdf'

      notice = Honeybadger.notify("Honeybadger don't care, but you might.")

      expect(notice.stack).toEqual(jasmine.any(String))
      expect(notice.generator).toEqual('throw')
      expect(notice.message).toEqual("Honeybadger don't care, but you might.")
      expect(Honeybadger._sendRequest).toHaveBeenCalled()

    it 'accepts options as first argument', ->
      Honeybadger.configure
        api_key: 'asdf'

      try
        throw new Error("Honeybadger don't care, but you might.")
      catch e
        Honeybadger.notify(error: e)

      expect(Honeybadger._sendRequest).toHaveBeenCalled()

    it 'accepts name as second argument', ->
      Honeybadger.configure
        api_key: 'asdf'

      try
        throw new Error("Honeybadger don't care, but you might.")
      catch e
        Honeybadger.notify(e, 'CustomError')

      expect(Honeybadger._sendRequest).toHaveBeenCalled()

    it 'accepts options as third argument', ->
      Honeybadger.configure
        api_key: 'asdf'

      try
        throw new Error("Honeybadger don't care, but you might.")
      catch e
        Honeybadger.notify(e, 'CustomError', { message: 'Custom message' })

      expect(Honeybadger._sendRequest).toHaveBeenCalled()

  describe '.wrap', ->
    beforeEach () ->
      Honeybadger.configure
        api_key: 'asdf'
      spyOn(Honeybadger, 'notify')

    it 'notifies Honeybadger of errors and re-throws', ->
      func = () ->
        throw new Error("Testing")
      error = null

      try
        Honeybadger.wrap(func)()
      catch e
        error = e

      expect(error).toEqual(jasmine.any(Error))
      expect(Honeybadger.notify).toHaveBeenCalledWith(error)

  describe 'beforeNotify', ->
    beforeEach () ->
      notice = null
      Honeybadger.beforeNotifyHandlers.length = 0
      Honeybadger.configure
        api_key: 'asdf'
      spyOn(Honeybadger, '_sendRequest')

    it 'does not deliver notice when  beforeNotify callback returns false', ->
      Honeybadger.beforeNotify () -> false

      try
        throw new Error("Testing")
      catch e
        Honeybadger.notify(e)

      expect(Honeybadger._sendRequest).not.toHaveBeenCalled()

    it 'delivers notice when beforeNotify returns true', ->
      Honeybadger.beforeNotify () -> true

      try
        throw new Error("Testing")
      catch e
        Honeybadger.notify(e)

      expect(Honeybadger._sendRequest).toHaveBeenCalled()

    it 'delivers notice when beforeNotify has no return', ->
      Honeybadger.beforeNotify () ->

      try
        throw new Error("Testing")
      catch e
        Honeybadger.notify(e)

      expect(Honeybadger._sendRequest).toHaveBeenCalled()

  describe '#_serialize()', ->
    obj = {foo: 'foo', bar: {baz: 'baz'}}

    it 'serializes an object to a query string', ->
      expect(Honeybadger._serialize(obj)).toEqual('foo=foo&bar%5Bbaz%5D=baz')

    it 'drops null values', ->
      expect(Honeybadger._serialize({foo: null, bar: 'baz'})).toEqual('bar=baz')

    it 'drops undefined values', ->
      expect(Honeybadger._serialize({foo: undefined, bar: 'baz'})).toEqual('bar=baz')

  describe 'window.onerror callback', ->
    beforeEach () ->
      spyOn Honeybadger, 'notify'

    describe 'default behavior', ->
      it 'notifies Honeybadger of unhandled exceptions', ->
        window.onerror 'testing', 'http://foo.bar', '123'

        expect(Honeybadger.notify).toHaveBeenCalledWith(jasmine.any(Error))

      it 'skips cross-domain script errors', ->
        window.onerror 'Script error', 'http://foo.bar', 0

        expect(Honeybadger.notify).not.toHaveBeenCalledWith(jasmine.any(Error))

    describe 'when onerror is disabled', ->
      beforeEach () ->
        Honeybadger.configure
          api_key: 'asdf',
          onerror: false

      it 'ignores unhandled errors', ->
        window.onerror 'testing', 'http://foo.bar', 0
        expect(Honeybadger.notify).not.toHaveBeenCalled()
