/**
 * Nuxt Compiler Macros Type Declarations
 * ใช้สำหรับแก้ปัญหา Vetur extension ที่ไม่รู้จัก Nuxt 3 compiler macros
 */

declare global {
  /**
   * Define page metadata
   * @see https://nuxt.com/docs/api/utils/define-page-meta
   */
  function definePageMeta(meta: {
    layout?: string
    middleware?: string | string[]
    pageTransition?: any
    layoutTransition?: any
    key?: string | ((route: any) => string)
    keepalive?: boolean | any
    name?: string
    path?: string
    alias?: string | string[]
    [key: string]: any
  }): void
}

export {}
